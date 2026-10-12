# SnapShare Scaling Plan

## 1. Assumptions and Daily Active Users
* **Registered Users:** 10 million.
* **Daily Active Users (DAU):** 10% of registered users = **1,000,000 DAU**.
* **Uploads:** 1 photo per DAU per day = 1,000,000 uploads/day.
* **Reads:** 50 feed pages per DAU per day = 50,000,000 feed views/day.
* **Peak Traffic:** Assumed to be 5× the average traffic rate.
* **File Sizes:** 2 MB per original photo + 50 KB per thumbnail = 2.05 MB total per upload.

## 2. Traffic and Storage Estimates
* **Uploads per second (Average):** 1,000,000 / 86,400 seconds ≈ **11.5 uploads/sec**.
* **Uploads per second (Peak):** 11.5 × 5 = **57.5 uploads/sec**.
* **Feed views per second (Average):** 50,000,000 / 86,400 seconds ≈ **578.7 views/sec**.
* **Feed views per second (Peak):** 578.7 × 5 = **2,893.5 views/sec**.
* **Storage per year:** 1,000,000 uploads/day × 2.05 MB = ~2.05 TB/day. Over 365 days, this equals **~748.25 TB/year**.

## 3. System Load Characteristics
**The system is heavily read-heavy.** With 50 million feed views compared to 1 million photo uploads daily, the read-to-write ratio is 50:1. For the system design, this means our primary bottleneck will be serving the feed quickly. We must optimize for reads by utilizing caching aggressively, routing database queries to read replicas, and serving static media through a global CDN.

## 4. Photo Storage Strategy
Photos should **not** be stored directly inside the relational database as binary blobs. Storing large files in a database severely bloats the table size, slows down standard metadata queries, makes database backups massively expensive and time-consuming, and depletes database RAM caches. Instead, photos should be stored in dedicated **Object Storage** (like Amazon S3), while the database only stores the metadata (e.g., image URL, user ID, timestamp).

## 5. Architecture Diagram

```text
[Mobile/Web Clients] 
        |
        v
    [ CDN ] <----------------------------------------+ (Serves Cached Photos)
        |                                            |
        v                                            |
[ Load Balancer ]                                    |
        |                                            |
        +-----------------------+                    |
        |                       |                    |
  [App Server 1]          [App Server 2]             |
        |                       |                    |
        +-------+-------+-------+                    |
                |       |                            |
  +-------------+       +-------------+              |
  |             |                     |              |
[Cache]    [Primary DB] --(Sync)--> [Read Replica DB]|
                |                     |              |
                v                     |              |
         [Message Queue]              |              |
                |                     |              |
          [Worker Node]               |              |
                |                     |              |
                +-> [ Object Storage ]---------------+ 
```

## 6. Component Explanations
* **CDN (Content Delivery Network):** Caches and serves static media (photos and thumbnails) from edge servers physically close to the user to drastically reduce load times and save server bandwidth.
* **Load Balancer:** Distributes incoming API traffic evenly across multiple application servers to prevent any single server from becoming overwhelmed during peak hours.
* **App Servers:** Stateless web servers that execute business logic, authenticate users, handle API requests, and coordinate between the database and storage.
* **Cache:** In-memory data store (e.g., Redis) that holds pre-computed user feeds and session data for sub-millisecond retrieval, bypassing the database for frequent requests.
* **Primary Database:** A relational database handling all write operations (like inserting new user metadata or recording a follow relationship) to maintain strong data integrity.
* **Read Replica:** A synchronized copy of the primary database used exclusively to serve read queries (like fetching user profiles), protecting the primary database from read exhaustion.
* **Object Storage:** Highly scalable, flat storage system built specifically for holding massive amounts of unstructured binary files affordably.
* **Message Queue:** A buffer (e.g., RabbitMQ) that temporarily holds "thumbnail creation" tasks, decoupling heavy processing from the fast user-facing API.
* **Worker Node:** A background server that pulls tasks from the queue, downloads the photo, generates the thumbnail, and saves it without making the end-user wait.

## 7. Photo Upload Flow
1. The user selects a photo on their device and the app sends a `POST` request to the App Server.
2. The App Server streams the 2 MB image directly to Object Storage and receives a storage URL in return.
3. The App Server writes the photo metadata (uploader ID, caption, Object Storage URL) to the Primary Database.
4. The App Server drops a "create thumbnail" message into the Message Queue containing the new photo's ID.
5. The App Server immediately returns a `200 OK` response to the user, allowing them to continue using the app without waiting for the thumbnail processing.
6. Asynchronously, a Worker Node picks up the message from the Queue.
7. The Worker Node fetches the original photo from Object Storage, compresses it into a 50 KB thumbnail, and uploads the thumbnail back to Object Storage.
8. The Worker Node updates the photo's record in the Primary Database with the new thumbnail URL.

## 8. Trade-offs
* **Asynchronous Processing vs. Immediate Visual Consistency:** By offloading thumbnail generation to a background queue, we achieve a lightning-fast upload experience for the user. The trade-off is eventual consistency; for a few seconds after uploading, the user's followers might see a generic placeholder icon instead of the thumbnail until the worker finishes the job.
* **Database Normalization vs. Caching Complexity:** Relying heavily on Redis to cache user feeds allows us to handle the 50:1 read-heavy load efficiently. The trade-off is a significantly more complex system architecture; when a user deletes a photo or changes their username, the application must invalidate and rebuild those cache entries, introducing the risk of stale data being shown to users.
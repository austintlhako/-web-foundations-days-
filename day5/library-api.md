# Library Books REST API

## Endpoints

* **List all books**
  * **Method:** `GET`
  * **Path:** `/books`
  * **Description:** Retrieves a complete list of all books in the library catalog.
  * **Success Status:** `200 OK`

* **Get a specific book**
  * **Method:** `GET`
  * **Path:** `/books/:id`
  * **Description:** Retrieves the full details of a single book by its unique ID.
  * **Success Status:** `200 OK`

* **List books by an author**
  * **Method:** `GET`
  * **Path:** `/books?author={authorName}`
  * **Description:** Retrieves a filtered list of books written by a specific author.
  * **Success Status:** `200 OK`

* **Create a new book**
  * **Method:** `POST`
  * **Path:** `/books`
  * **Description:** Adds a newly acquired book to the library's catalog.
  * **Example Request Body:** 
    ```json
    {
      "title": "Dune",
      "author": "Frank Herbert",
      "publishedYear": 1965
    }
    ```
  * **Success Status:** `201 Created`

* **Update a book**
  * **Method:** `PUT`
  * **Path:** `/books/:id`
  * **Description:** Completely updates an existing book's details.
  * **Example Request Body:**
    ```json
    {
      "title": "Dune - 50th Anniversary Edition",
      "author": "Frank Herbert",
      "publishedYear": 2015
    }
    ```
  * **Success Status:** `200 OK`

* **Delete a book**
  * **Method:** `DELETE`
  * **Path:** `/books/:id`
  * **Description:** Removes a book from the library catalog permanently.
  * **Success Status:** `204 No Content`

## Error Codes

* **`400 Bad Request`**
  * **Example:** This happens when a client tries to create a new book (`POST /books`), but the request body is missing required fields (like submitting a book without a "title"), or the submitted JSON data is malformed.
* **`404 Not Found`**
  * **Example:** This happens when a client tries to retrieve, update, or delete a book ID that does not exist in the database (e.g., calling `GET /books/99999` when the ID 99999 has never been created or was already deleted).
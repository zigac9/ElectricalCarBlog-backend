# Electrical Car Blog

Electrical Car Blog is an interactive, dynamic blogging platform focused on electric vehicles and related technology. The application provides a blend of social networking and blogging, giving users the power to create, edit, and remove posts as well as conduct user searches and more.

# Server

Our server uses a secure connection to MongoDB for data storage and management. The server-side code uses Express.js for creating the web server and managing HTTP requests and responses. The server also leverages the power of Node.js and a series of middleware functions to handle requests and process data.

## Database Connection

For establishing a secure connection with MongoDB, we're using the dotenv package to manage environment variables. On successful connection, you'll see the "Database connected" message on your console.

# API Documentation

This document describes the APIs provided by our server, hosted on Heroku at [https://electrical-car-blog-backend-7d9939409270.herokuapp.com/](https://electrical-car-blog-backend-7d9939409270.herokuapp.com/). 

## APIs Overview

Our server exposes several APIs to interact with various components of our system:

- **User API** (`/api/users`): Manages user-related operations such as registration, login, profile updates, and user deletion.

- **Post API** (`/api/posts`): Enables CRUD operations (Create, Read, Update, Delete) on blog posts.

- **Comment API** (`/api/comments`): Facilitates comment creation, retrieval, updating, and deletion.

- **Email API** (`/api/email`): Used for email-related functionalities.

- **Category API** (`/api/category`): Handles operations related to blog post categories.

- **Charger API** (`/api/charger`): Manages operations related to electric vehicle (EV) chargers.

### User API Endpoints

The User API provides a comprehensive suite of endpoints for managing users and their interactions with our system:

- **POST /api/users/register**: Registers a new user.

- **POST /api/users/login**: Authenticates a user and starts a new session.

- **GET /api/users/**: Retrieves a list of all registered users.

- **PUT /api/users/password**: Allows a user to update their password.

- **PUT /api/users/follow**: Enables a user to follow another user.

- **PUT /api/users/unfollow**: Enables a user to unfollow a user they are currently following.

- **POST /api/users/generate-verify-email-token**: Generates an email verification token for the logged-in user.

- **PUT /api/users/verify-account**: Verifies a user's account using the provided verification token.

- **POST /api/users/forget-password-token**: Generates a token for resetting a forgotten password.

- **PUT /api/users/reset-password**: Allows a user to reset their password using the provided reset token.

- **POST /api/users/block-user/:blockId**: Enables a user to block another user.

- **POST /api/users/unblock-user/:blockId**: Allows a user to unblock a user they have previously blocked.

- **GET /api/users/profile/:userId**: Fetches the profile details of a given user.

- **PUT /api/users/**: Enables a user to update their own profile details.

- **DELETE /api/users/:userId**: Deletes the account of a given user.

- **GET /api/users/:userId**: Fetches the details of a given user.

- **PUT /api/users/upload-cover-photo**: Allows a user to upload and update their cover photo.

- **PUT /api/users/upload-profile-photo**: Allows a user to upload and update their profile photo.

### Post API Endpoints

The Post API offers various endpoints to manage posts and related interactions within our system:

- **PUT /api/posts/like**: Likes a post. Requires authorization.

- **PUT /api/posts/dislike**: Dislikes a post. Requires authorization.

- **POST /api/posts/**: Creates a new post with an image. The image is uploaded and resized during this process. Requires authorization.

- **GET /api/posts/**: Retrieves a list of all posts.

- **GET /api/posts/:id**: Fetches the details of a post by ID.

- **PUT /api/posts/:id**: Updates a post by ID, and uploads and resizes a new image if provided. Requires authorization.

- **DELETE /api/posts/:id**: Deletes a post by ID. Requires authorization.

### Comment API Endpoints

The Comment API offers a wide range of endpoints for managing comments and interactions related to them within our system:

- **PUT /api/comments/like**: Likes a comment. Requires authorization.

- **PUT /api/comments/dislike**: Dislikes a comment. Requires authorization.

- **POST /api/comments/**: Creates a new comment. Requires authorization.

- **GET /api/comments/**: Retrieves a list of all comments. Requires authorization.

- **GET /api/comments/:id**: Fetches the details of a comment by ID. Requires authorization.

- **PUT /api/comments/:id**: Updates a comment by ID. Requires authorization.

- **DELETE /api/comments/:id**: Deletes a comment by ID. Requires authorization.

### Email API Endpoints

The Email API provides endpoints for sending email messages within our system:

- **POST /api/email/**: Sends an email message to user. Requires authorization.

- **POST /api/email/toAdmin**: Sends an email message to the administrator. 

### Category API Endpoints

The Category API offers a variety of endpoints for managing categories within our system:

- **POST /api/categories/**: Creates a new category. Requires authorization.

- **GET /api/categories/**: Retrieves a list of all categories.

- **GET /api/categories/:id**: Fetches the details of a category by ID. Requires authorization.

- **PUT /api/categories/:id**: Updates a category by ID. Requires authorization.

- **DELETE /api/categories/:id**: Deletes a category by ID. Requires authorization.

### Charger API Endpoints

The Charger API offers various endpoints for managing EV chargers within our system:

- **POST /api/chargers/**: Creates a new EV charger. Requires authorization.

- **DELETE /api/chargers/:id**: Deletes an EV charger by ID. Requires authorization.

- **GET /api/chargers/:id**: Fetches the details of an EV charger by ID.

- **PUT /api/chargers/:id**: Updates an EV charger by ID. Requires authorization.

- **DELETE /api/chargers/**: Deletes all EV chargers. Requires authorization.

- **POST /api/chargers/create**: Creates EV charger in post. Requires authorization.

Please note that some of these routes are protected, meaning they require a valid JWT (JSON Web Token) in the request header to authenticate the user.

## Server Port

To run the server locally, navigate to the root directory of the project in your terminal and run the command `npm start`. The server is configured to listen on port 5000, unless the PORT environment variable is set to a different value. 

The server is also deployed on Heroku, you can access it [here](https://electrical-car-blog-backend-7d9939409270.herokuapp.com/).

## Live Demo Page
You can view the live demo of [Electrical car blog application](https://github.com/zigac9/ElectricalCarBlog-frontend) that is using this server at [electrical-car-blog](https://electrical-car-blog.netlify.app)

## About the Developer

Ziga Crv is a 22-year-old computer science student from Tolmin, Slovenia, currently enrolled at the University of Ljubljana. Alongside his studies, he is gaining practical experience as a software developer at Marand d.o.o. This application serves as his diploma thesis, showcasing his skills and knowledge in the field of computer science.

## License

This project is licensed under the [GNU General Public License, version 3 (or later)](http://www.gnu.org/licenses/). This means it can be freely distributed and/or modified under the conditions of this license. Detailed license information can be accessed on the following website: http://www.gnu.org/licenses/.

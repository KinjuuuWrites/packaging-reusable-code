## What's reusable code?

Let's say you're building a product which is spread across multiple micro-services. Generally the notion of micro-services is to develop independently, still there might be some parts of code which you'll tend to use in different micro-services.

A basic approach would be writing a piece of code in a particular micro-service and then replicating it into all the others. However this would lead to inconsistency due to using different versions of the code across the micro-services. In other words, maintaining such a code base would be difficult.

## Git Submodules?

Using git submodules, you can set up a directory within your codebase with links up to another git repository. You can write up the reusable parts of the code in a standalone git repository and use it as a submodule in all your micr-services.

However, many developer just do not prefer using git submodules. There are various reasons for it, starting from poor development experience to struggles while deploying.

You might want to read them in details [here](https://abildskov.io/2021/03/28/why-i-hate-submodules/)

## Packages

Packages are small libraries of code which we install and import in our project to make our lives easier! We do not code everything from scratch. For some stuffs, we prefer the abstraction that a package can offer.

A popular package manager and registry among Javascript developers is [npm](https://www.npmjs.com/)

Public packages help us develop our services. However, we can also create our own packages. We can package our reusable code as a library and use it in any of our micro-services easily.

> In this post, I would be demonstrating how to package an ExpressJS middleware and use it in a micro-service

## Lets get started!

Like _Linus Torvalds_ said:

> Talk is cheap. Show me the code.

_Not a fan of following through? Head to the GitHub Repository straightway:_

{% github https://github.com/KinjuuuWrites/packaging-reusable-code %}

### Middlewares (Reusable code part)

Bootstrap a NodeJS project as you want and install the dependencies required.
Herein is a basic authentication middleware that verifies a JWT token, decodes it and set's it in the request:

```js
// authentication.js

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, "myjwtsecretthatnobodyknows");

      req.user_id = decoded._id;
      next();
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Token expired or couldn't be verified!" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized: No token found" });
  }
};
```

Also adding an `index.js` file that would help managing multiple middlewares if we plan to extend them!

```js
// index.js

const authentication = require("./authentication");

module.exports = {
  authentication,
};
```

You'll see that this package doesn't officially have any entry point or an express server initialized. I didn't even install or use the `express` here. This is because I'm just focusing and developing the middlewares as a standalone package and not the entire server here

Finally the package.json file to complete the project:

```json
// package.json

{
  "name": "@prc/middlewares",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "pack": "npm pack --pack-destination ../packages"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "jsonwebtoken": "^8.5.1"
  }
}
```

A few things to look out in the `package.json` file:

- The `name` field: See how I prefixed the name with `@prc`. This is done to scope a package. Generally this is set to the name of your organization. Read in details about scoped packages [here](https://docs.npmjs.com/cli/v8/using-npm/scope)
- The `pack` script: Used to package the pack the npm library into a tarball. Feel free to set the `pack-destination` to anywhere in your local system, however take note of it as we'll need in later!

> For sake of simplicity, I'll use this script to generate a tarball and install from it. In a professional setting, packages are generally published to a registry (Read more about publishing below)

Run the following command from the project directory to generate the tarball for the package:

```sh
npm run pack
```

You'll see that the tarball is generated as: _`prc-middlewares-1.0.0.tgz`_.

### ExpressJS server (Micro-service)

Bootstrap a ExpressJS project. Install `express` and other required dependencies.

Add the middlewares package as dependencies in the `package.json` file as shown here:

```json
{
  "name": "user",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@prc/middlewares": "file:../packages/prc-middlewares-2.0.0.tgz",
    "express": "^4.18.1",
    "jsonwebtoken": "^8.5.1"
  }
}
```

The dependency `@prd/middlewares` is set as the file path of the packaged tarball file (which was noted in the previous step). This should be a relative path and prefixed with `file:`

> Note: When using a published package, you might need to specify the package version, git repository or package registry details!

Make sure you run install after this:

```sh
npm install
```

Finally the server should look something like this:

```js
// server.js

const express = require("express");
const { authentication } = require("@prc/middlewares");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "kinjal" && password === "123456") {
    const token = jwt.sign({ _id: 4 }, "myjwtsecretthatnobodyknows");
    return res.json({ token });
  } else {
    return res.status(401).json({ msg: "incorrect credentials!" });
  }
});

app.get("/user", authentication, (req, res) => {
  return res.json({
    msg: "Hello there!",
    user_id: req.user_id,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, console.log(`Server is running on port ${PORT} 🚀`));
```

Note how we `require` the `@prc/middlewares` like any other package and use the `authentication` middleware in the `/user` route!

## Publishing

While developing a bunch of microservices with multiple developers, packaging libraries locally doesn't solve anything. Instead, developers often prefer versioning and publishing the packages. Packages are generally published to registries as private packages using npm, GitHub or sometimes behind an organization's firewall (like AWS CodeArtifact)

Here's an amazing article to get started with publishing private NPM packages:
[Creating and publishing private packages | npm Docs](https://docs.npmjs.com/creating-and-publishing-private-packages)

You might also need to work with multiple registries in a single project. Scoped packages come in handy in such situations. To get into details, refer:
[Loading npm dependencies from multiple registries | Eckher](https://www.eckher.com/c/21g2_hpfhs)

const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

module.exports = {
  //   createUser(args, req) {

  // createUser: async function ({ userInput }, req) {
  //   // const email = args.userInput.email;
  //   console.log(userInput);
  //   const existingUser = await User.findOne({ email: userInput.email });
  //   if (existingUser) {
  //     const error = new Error("User exists already!");
  //     throw error;
  //   }
  //   const hashedPW = await bcrypt.hash(userInput.password, 12);
  //   console.log(hashedPW);
  //   const user = new User({
  //     email: userInput.email,
  //     name: userInput.name,
  //     password: hashedPW,
  //   });
  //   const createUser = await user.save();
  //   return { ...createUser._doc, _id: createUser._id.toString() };
  // },
  createUser({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "E-Mail is invaild." });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    return User.findOne({ email: userInput.email })
      .then((userDoc) => {
        if (userDoc) {
          const error = new Error("User exists already!");
          throw error;
        }
        return bcrypt.hash(userInput.password, 12).then((hashedPW) => {
          const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPW,
          });
          return user.save().then((result) => {
            // console.log(result);
            return { ...result._doc, _id: result._id.toString() };
          });
        });
      })
      .catch((err) => {
        // console.log(err);
      });
  },

  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found.");
      error.code = 401; // for user not authenticated
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is incorrect.");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      "somesupersecretsecret",
      { expiresIn: "1h" }
    );
    return { token: token, userId: user._id.toString() };
  },

  createPost: async function ({ postInput }, req) {
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is invalid." });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content)
    ) {
      errors.push({ message: "Content is invalid." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = 422;
      throw error;
    }
    // console.log(req.userId);
    const user = await User.findById({ _id: req.userId });
    if (!user) {
      const error = new Error("Invalid user.");
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    // Add post to users' posts
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find().sort({ createdAt: -1 }).populate("creator");

    console.log(posts);
    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
};

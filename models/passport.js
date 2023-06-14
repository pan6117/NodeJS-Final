const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./user");

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return done(null, false);
        }
        user
          .comparePassword(password)
          .then((isMatch) => {
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          })
          .catch((err) => done(err));
      })
      .catch((err) => done(err));
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => done(err));
});

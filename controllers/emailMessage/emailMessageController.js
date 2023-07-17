const expressAsyncHandler = require("express-async-handler");
const sendGridEmail = require("@sendgrid/mail");
const EmailMessage = require("../../model/emailMessage/EmailMessage");
const {
  checkForProfaneWords,
  checkForCrossSiteScripting,
} = require("../../middlewares/profaneWords/profaneWords");

const sendEmailMessageController = expressAsyncHandler(async (req, res) => {
  //check for cross site scripting
  const { allowRequestErr, returnMessageErr } =
    await checkForCrossSiteScripting(req);
  if (!allowRequestErr) {
    throw new Error(returnMessageErr);
  }

  const { to, subject, message } = req.body;

  // check if account is verified
  if (!req?.user?.isAccountVerified) {
    throw new Error(
      "Your account is not verified! You cannot send message to user.",
    );
  }

  //Check for bad words
  const { allowRequest, returnMessage } = await checkForProfaneWords(
    req?.user?._id,
    req,
  );
  if (!allowRequest) {
    throw new Error(returnMessage);
  }

  if (!to) {
    throw new Error("Recipient Email is required.");
  } else if (/[<>]/.test(to)) {
    throw new Error("Recipient Email cannot contain characters < or >");
  } else if (!/\S+@\S+\.\S+/.test(to)) {
    throw new Error("Invalid email format.");
  }

  if (!subject) {
    throw new Error("Subject is required");
  } else if (!/^[a-zA-Z0-9 ]*$/.test(subject)) {
    throw new Error("Subject cannot contain special characters.");
  } else if (subject.length < 5) {
    throw new Error("Subject cannot be less than 5 characters.");
  } else if (subject.length > 30) {
    throw new Error("Subject cannot be more than 30 characters.");
  }

  if (!message) {
    throw new Error("Message is required");
  } else if (/[<>]/.test(to)) {
    throw new Error("Message cannot contain characters < or >");
  } else if (message.length < 10) {
    throw new Error("Message cannot be less than 10 characters.");
  } else if (message.length > 500) {
    throw new Error("Message cannot be more than 500 characters.");
  }

  try {
    //buld up msg
    const msg = {
      to,
      subject,
      text: message,
      from: "ziga.crv@tscng.org",
    };
    //send msg
    await sendGridEmail.send(msg);
    //save to our db
    await EmailMessage.create({
      sentBy: req?.user?._id,
      fromEmail: req?.user?.email,
      toEmail: to,
      message,
      subject,
    });
    res.json("Mail sent");
  } catch (error) {
    res.status(500).json(error);
  }
});

const sendEmailMessageToAdminController = expressAsyncHandler(
  async (req, res) => {
    //check for cross site scripting
    const { allowRequestErr, returnMessageErr } =
      await checkForCrossSiteScripting(req);
    if (!allowRequestErr) {
      throw new Error(returnMessageErr);
    }

    const { to, subject, category, message, from } = req.body;

    //Check for bad words
    const { allowRequest, returnMessage } = await checkForProfaneWords(
      req?.user?._id,
      req,
    );
    if (!allowRequest) {
      throw new Error(returnMessage);
    }

    if (!subject) {
      throw new Error("Subject is required");
    } else if (!/^[a-zA-Z0-9 ]*$/.test(subject)) {
      throw new Error("Subject cannot contain special characters.");
    } else if (subject.length < 5) {
      throw new Error("Subject cannot be less than 5 characters.");
    } else if (subject.length > 30) {
      throw new Error("Subject cannot be more than 30 characters.");
    }

    if (!message) {
      throw new Error("Message is required.");
    } else if (/[<>]/.test(to)) {
      throw new Error("Message cannot contain characters < or >");
    } else if (message.length < 10) {
      throw new Error("Message cannot be less than 10 characters.");
    } else if (message.length > 500) {
      throw new Error("Message cannot be more than 500 characters.");
    }

    if (!from) {
      throw new Error("Email is required.");
    } else if (!/^[^<>]*$/.test(from)) {
      throw new Error("Email cannot contain characters < or >");
    } else if (!/\S+@\S+\.\S+/.test(from)) {
      throw new Error("Invalid email format.");
    }

    try {
      //buld up msg
      const msg = {
        to,
        subject: subject + " - " + category,
        text: message,
        from: "ziga.crv@tscng.org",
      };
      //send msg
      await sendGridEmail.send(msg);
      //save to our db
      await EmailMessage.create({
        fromEmail: from,
        toEmail: to,
        category,
        message,
        subject,
      });
      res.json("Mail sent");
    } catch (error) {
      res.status(500).json(error);
    }
  },
);

module.exports = {
  sendEmailMessageController,
  sendEmailMessageToAdminController,
};

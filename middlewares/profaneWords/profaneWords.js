const Filter = require("bad-words");
const User = require("../../model/user/User");

// create function
const checkForProfaneWords = async (id, req) => {
  const filter = new Filter();
  const { title, description, message, subject, carName } = req.body;
  const isProfaneTitle = filter.isProfane(title);
  const isProfaneDescription = filter.isProfane(description);
  const isProfaneMessage = filter.isProfane(message);
  const isProfaneSubject = filter.isProfane(subject);
  const isProfaneCarName = filter.isProfane(carName);

  if (
    isProfaneTitle ||
    isProfaneDescription ||
    isProfaneMessage ||
    isProfaneSubject ||
    isProfaneCarName
  ) {
    const user = await User.findByIdAndUpdate(
      id,
      {
        $inc: { warningsCount: 1 },
      },
      { new: true },
    );

    if (user.warningsCount >= 3) {
      const userBlocked = await User.findByIdAndUpdate(
        id,
        {
          $set: { isBlocked: true },
        },
        { new: true },
      );
      userBlocked.save();
      return {
        returnMessage:
          "You reached your third warning, you have been blocked! Contact the administrator to unblock you.",
        allowRequest: false,
      };
    }
    user.save();
    return {
      returnMessage: `You have been warned for using profane words in your post. You have ${
        3 - user.warningsCount
      } warnings left`,
      allowRequest: false,
    };
  }
  return { allowRequest: true };
};

const checkForCrossSiteScripting = (req) => {
  const {
    title,
    description,
    message,
    subject,
    password,
    confirmPassword,
    oldPassword,
    to,
    from,
    email,
    firstName,
    lastName,
    carName,
    usableBatterySize,
    efficiency,
  } = req.body;

  const isCrossSiteScriptingTitle =
    title?.includes("<") || title?.includes(">");
  const isCrossSiteScriptingDescription =
    description?.includes("<") || description?.includes(">");
  const isCrossSiteScriptingMessage =
    message?.includes("<") || message?.includes(">");
  const isCrossSiteScriptingSubject =
    subject?.includes("<") || subject?.includes(">");
  const isCrossSiteScriptingPassword =
    password?.includes("<") || password?.includes(">");
  const isCrossSiteScriptingConfirmPassword =
    confirmPassword?.includes("<") || confirmPassword?.includes(">");
  const isCrossSiteScriptingTo = to?.includes("<") || to?.includes(">");
  const isCrossSiteScriptingFrom = from?.includes("<") || from?.includes(">");
  const isCrossSiteScriptingEmail =
    email?.includes("<") || email?.includes(">");
  const isCrossSiteScriptingFirstName =
    firstName?.includes("<") || firstName?.includes(">");
  const isCrossSiteScriptingLastName =
    lastName?.includes("<") || lastName?.includes(">");
  const isCrossSiteScriptingOldPassword =
    oldPassword?.includes("<") || oldPassword?.includes(">");
  const isCrossSiteScriptingCarName =
    carName?.includes("<") || carName?.includes(">");
  const isCrossSiteScriptingUsableBatterySize =
    usableBatterySize?.includes("<") || usableBatterySize?.includes(">");
  const isCrossSiteScriptingEfficiency =
    efficiency?.includes("<") || efficiency?.includes(">");

  if (
    isCrossSiteScriptingTitle ||
    isCrossSiteScriptingDescription ||
    isCrossSiteScriptingMessage ||
    isCrossSiteScriptingSubject ||
    isCrossSiteScriptingPassword ||
    isCrossSiteScriptingConfirmPassword ||
    isCrossSiteScriptingTo ||
    isCrossSiteScriptingFrom ||
    isCrossSiteScriptingEmail ||
    isCrossSiteScriptingFirstName ||
    isCrossSiteScriptingLastName ||
    isCrossSiteScriptingOldPassword ||
    isCrossSiteScriptingCarName ||
    isCrossSiteScriptingUsableBatterySize ||
    isCrossSiteScriptingEfficiency
  ) {
    return {
      returnMessageErr: "You have been warned for using cross site scripting",
      allowRequestErr: false,
    };
  }
  return { allowRequestErr: true };
};

module.exports = { checkForProfaneWords, checkForCrossSiteScripting };

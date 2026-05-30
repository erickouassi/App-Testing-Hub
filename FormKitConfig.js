export const FormKitConfig = {
  endpoint: "https://android-app-testing-directory.hello-99b.workers.dev/",
   sheetId: "1Mml0KL4i56hfCtTEdNS2I2DwjIfm_TKpqlBDU7n6OJI",

  // These must match your form's input names
  fields: ["name", "email", "feedUrl", "optin"],

  autoReply: {
    enabled: true,
    subject: "Your feed submission has been received",
    top: "Hi {{name}},\n\nThank you for submitting your feed.",
    bottom: "\n\nBlessings,\nYour Team"
  },

  admin: {
    enabled: true,
    email: "hello@erickouassi.com"
  }
};

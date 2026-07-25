import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    default: {
      type: "hosted",
    },
    // Sign-in renders inline on the console page itself (SignInGate) —
    // point the redirect helpers there so post-auth navigation stays coherent.
    signIn: "/",
    afterSignIn: "/",
    afterSignUp: "/",
    afterSignOut: "/",
    home: "/",
  },
});

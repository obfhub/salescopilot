import { loadEnvConfig } from "@next/env";
import { verifyEmailTransport } from "../lib/email";

loadEnvConfig(process.cwd());

verifyEmailTransport()
  .then(() => {
    console.log("SMTP verified");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

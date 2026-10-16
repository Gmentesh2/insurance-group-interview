import { assistantMessages } from './assistant';
import { passwordAuthMessages } from './password-auth';
import { homepageMessages } from './homepage';
import { currencyMessages } from './currency';
import { productMessages } from "./products";
import { flowMessages } from "./flow";
import { guestMessages } from "./guest";
import { operationsDesignMessages } from "./operations-design";
import { workspaceDesignMessages } from "./workspace-design";
import { platformDesignMessages } from "./platform-design";
import { demoDesignMessages } from "./demo-design";
import { walletDesignMessages } from "./wallet-design";
import type { Locale } from "@/lib/contracts";
import { coreMessages } from "./core";
import { accountMessages } from "./account";
import { checkoutRecoveryMessages } from "./checkout-recovery";
import { quoteDesignMessages } from "./quote-design";
import { authDesignMessages } from "./auth-design";
import { landingDesignMessages } from "./landing-design";
import { checkoutDesignMessages } from "./checkout-design";
import { supportDesignMessages } from "./support-design";
import { policyDesignMessages } from "./policy-design";

/** Use the same catalog for server translations and the client provider. */
export function messagesFor(locale: Locale) {
  return {
    assistant: assistantMessages[locale],
    passwordAuth: passwordAuthMessages[locale],
    currency: currencyMessages[locale],
    homepage: homepageMessages[locale],
    products: productMessages[locale],
    flow: flowMessages[locale],
    guest: guestMessages[locale],
    operationsDesign: operationsDesignMessages[locale],
    workspaceDesign: workspaceDesignMessages[locale],
    platformDesign: platformDesignMessages[locale],
    demoDesign: demoDesignMessages[locale],
    walletDesign: walletDesignMessages[locale],
    ...coreMessages[locale],
    account: accountMessages[locale],
    checkoutRecovery: checkoutRecoveryMessages[locale],
    quoteDesign: quoteDesignMessages[locale],
    authDesign: authDesignMessages[locale],
    landingDesign: landingDesignMessages[locale],
    checkoutDesign: checkoutDesignMessages[locale],
    supportDesign: supportDesignMessages[locale],
    policyDesign: policyDesignMessages[locale],
  };
}

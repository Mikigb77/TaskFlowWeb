import type { LegalCopy } from "./types";

export const en: LegalCopy = {
  privacy: {
    title: "TaskFlow Privacy Policy",
    description:
      "Privacy Policy for the TaskFlow app and website: your account, tasks, voice, files and choices.",
    summary: [
      "We don’t sell your data or show you ads.",
      "Your words go to Google’s AI only when you ask TaskFlow to understand them: to add, find or change tasks.",
      "You can get a copy of your data or delete it whenever you want.",
    ],
    sections: [
      {
        id: "controller",
        title: "1. Who is responsible",
        company: true,
        paragraphs: [
          "GARBAR, IN-TEC, S.L. is the operator of TaskFlow and the controller of the personal data described here. TaskFlow is the product name. This policy covers the mobile app, its account and cloud services, invitations and recovery pages, and taskflow.garbar.tech. The website’s live demonstration is separate from app accounts.",
          "This notice explains data use; it is not a request for blanket consent. Where a feature needs separate permission or consent, it must ask at the appropriate time.",
          "Use taskflow@garbar.tech for general enquiries and taskflow.support@garbar.tech for support, privacy rights and account deletion. Both reach our company mailbox. Automatic emails (invitations, email confirmation codes and password recovery) come from taskflow.noreply@garbar.tech; that sender is not monitored, and replies are directed to support. You do not need to use a particular subject or form to exercise your rights.",
        ],
        contact: "privacy",
      },
      {
        id: "data",
        title: "2. Information we process",
        bullets: [
          "Account: email address, optional name, timezone, an internal user identifier, your password (for password accounts), stored so it can’t be read back, and login/session records. With Google sign-in, we receive your Google account identifier, your email, whether Google has verified it, and your first name, which becomes your TaskFlow name if you haven’t given one. We don’t keep your photo. Password sign-ups confirm their email with a 6-digit code that expires after 30 minutes. We do not receive your Google password or request access to Gmail or Google Drive.",
          "Organisation: tasks, notes, dates, priorities, checklists, recurrence, completion history, projects, groups, assignments and the changes needed to synchronise them. Content is cached on your device and account content is synchronised with our servers.",
          "Files: the files or images you choose to attach, their names, sizes, a check code that spots damaged files, ownership and related task. Files are uploaded when you use cloud backup/sharing. A document or image may itself contain personal information or embedded metadata.",
          "Collaboration: membership, roles, invitation email addresses, sender names and acceptance status. If another user invites you before you have an account, that user is the source of your invitation details; we use them to deliver and manage the invitation, not to add you to marketing lists.",
          "Voice and AI: recordings or text you submit, the text of what you said, suggested tasks and changes, language, timezone, reference date and relevant project/member names used to interpret a request. We also record usage counts and processing status to apply usage limits.",
          "Subscriptions: an opaque billing identifier, product, purchase/renewal/expiry information, store transaction references and entitlement status. RevenueCat and the relevant app store process subscription information. We do not receive your full payment-card details.",
          "Operations and support: IP/connection information, request/error logs, your phone’s and app’s versions, which our providers’ components need, security counters and the messages you send us. The app’s capture diagnostics contain local counts and timings, not recordings or task text.",
        ],
      },
      {
        id: "purposes",
        title: "3. Why we use it and our legal bases",
        bullets: [
          "Providing the service and steps you request before a contract (GDPR Article 6(1)(b)): account access, synchronisation, file storage, the suggested tasks you ask for, subscriptions, recovery and support. Required account information is necessary to provide those features; optional voice and attachments are not needed to type a task.",
          "Legitimate interests (Article 6(1)(f)): keeping the service secure, preventing fraud and automated abuse, controlling resource use, investigating faults, and delivering an invitation initiated by an existing user. We balance these interests against your rights; you can object where this is the basis.",
          "Legal obligations (Article 6(1)(c)): tax/accounting records where applicable, lawful authority requests and handling data-protection rights.",
          "Consent (Article 6(1)(a)), where separately requested for an optional purpose: you can withdraw it without affecting earlier lawful processing. A device permission enables access to a device feature; it does not automatically authorise unrelated uses of its data.",
        ],
        paragraphs: [
          "We do not sell personal data, run advertising trackers, or use task content to target advertisements. We do not train our own AI model on your tasks. The AI suggests titles, dates and priorities for your review; it does not make decisions producing legal or similarly significant effects about you.",
        ],
      },
      {
        id: "voice",
        title: "4. Voice, AI and sensitive information",
        paragraphs: [
          "The microphone is used when you choose to record and grant the device permission. The mobile app can retain unfinished recordings, source text and suggested tasks locally so you can recover an interrupted capture. They are removed from that capture after all its suggested tasks have been saved or removed, or you explicitly discard it. When your phone can recognise speech by itself, your voice becomes text on the phone and no audio leaves it; only the words are sent. Otherwise the recording is sent to be turned into text online when you finish. With Pro, words you type for the AI are sent the same way. Without Pro, the task form never sends anything to the AI.",
          "Google processes submitted recordings/text and the relevant context to return suggested tasks and changes and, for a recording, the text of what you said. The app can use Google’s Gemini API, with Google Cloud’s Vertex AI as a fallback; the website demonstration uses Vertex AI. Google can process it outside the EU. Our servers do not deliberately persist raw recordings, but that does not mean Google retains no processing or security data.",
          "Google’s contractual treatment depends on the service and account tier. Paid Gemini API terms and the EEA provisions specify that prompts/responses are not used to improve Google products; unpaid services outside those provisions can involve model improvement and human review. Provider safety retention and international processing still apply. See the linked provider terms. We do not promise zero retention or EU-only processing.",
          "TaskFlow is a general planning tool, not a medical-record service or professional adviser. Avoid including health records, passwords, identity documents or other highly sensitive information in AI input. Do not record other people or upload their personal information without an appropriate legal basis. You can use manual task entry instead of AI. Review every generated date, time, assignment and note before saving.",
        ],
        links: [
          {
            label: "Google Gemini API terms",
            href: "https://ai.google.dev/gemini-api/terms",
          },
          {
            label: "Google Cloud data processing terms",
            href: "https://cloud.google.com/terms/data-processing-addendum",
          },
        ],
      },
      {
        id: "sharing",
        title: "5. Sharing and service providers",
        paragraphs: [
          "Personal content is not made public by default. Members of a shared project see your name on the tasks you create there (“Created by”) and on tasks assigned to you; if you haven’t given a name, they see the start of your email address. They can also show just one person’s tasks. A task, note or file placed in a shared project is available to its authorised members according to their roles. Group administrators/owners can manage access. Other members may download or copy content; leaving a group or deleting your account cannot remotely erase their independent copies.",
          "Providers receive the information needed for their function. They may act as processors under our instructions or, for their own account, payment, security or legal obligations, as independent controllers. Their own notices explain those separate activities.",
        ],
        bullets: [
          "Google Cloud: application hosting, operational logs, the website demo’s temporary database and Vertex AI processing. Google identity services also provide optional Google sign-in.",
          "Neon: the database of accounts and content, and private object storage for uploaded files. The test version’s database and files are in Frankfurt, Germany.",
          "Cloudflare: website delivery, connection security and Turnstile bot protection for the live demo.",
          "Resend: invitation, email-confirmation and recovery emails, including recipient address, message and delivery information. Our email integration does not enable open or click tracking.",
          "Google Workspace (Gmail): receiving, storing and replying to general enquiries, support conversations and privacy/deletion requests, including sender details, message content and any attachments you choose to send. Access is limited to people authorised to handle those requests.",
          "RevenueCat: subscription validation, customer entitlement information and data from its component in the app. Google Play handles store payments when real purchases are enabled. The test version uses test purchases, with no charge.",
          "Authorised support staff, professional advisers or authorities: only where necessary for support, a legal obligation or the establishment/exercise/defence of legal claims.",
        ],
        links: [
          {
            label: "Neon privacy notice",
            href: "https://neon.com/privacy-policy",
          },
          {
            label: "Cloudflare privacy notice",
            href: "https://www.cloudflare.com/privacypolicy/",
          },
          {
            label: "Resend privacy notice",
            href: "https://resend.com/legal/privacy-policy",
          },
          {
            label: "RevenueCat privacy notice",
            href: "https://www.revenuecat.com/privacy/",
          },
          {
            label: "Google privacy notice",
            href: "https://policies.google.com/privacy",
          },
        ],
      },
      {
        id: "transfers",
        title: "6. International processing",
        paragraphs: [
          "Hosting a database in the EU does not mean every provider processes all data only in the EU. Google’s AI, support and subscription, email and security providers can involve countries outside the European Economic Area.",
          "Transfers outside the EEA are subject to GDPR Chapter V. Depending on the recipient and processing, the relevant mechanism is an applicable European Commission adequacy decision or safeguards such as the Commission’s Standard Contractual Clauses and any necessary additional measures. The EU–US Data Privacy Framework applies only to certified recipients and covered processing. Contact taskflow.support@garbar.tech for the mechanism applicable to your data and a copy of the relevant safeguards.",
        ],
      },
      {
        id: "retention",
        title: "7. Storage, deletion and retention",
        bullets: [
          "Account and personal cloud content: retained while you use your account, until you delete the content or account. We never delete your tasks on our own, done or not. Deleting an individual item can leave synchronisation metadata; account deletion removes your personal database records and sessions.",
          "Personal attachments: account deletion removes access and requests deletion of the stored files. File removal follows the database transaction; a failed storage operation requires follow-up. Files belonging to continuing shared projects remain available to their members, as shown before you confirm deletion.",
          "Shared content: tasks, notes and files in continuing shared projects remain for the other members until deleted by an authorised member or the shared space ends. Ownership transfers shown in the deletion preview take effect on confirmation; your membership, assignments and identifying activity attribution are removed. Contact support about personal information within retained shared content.",
          "Device data: successful in-app deletion clears the app’s local account data and unfinished captures. Other signed-in devices lose access and clear their account copy when they next contact the service. Independent exports, downloaded copies outside app storage and device backups require separate removal. Uninstalling alone does not delete the server account.",
          "Invitations and codes: invitation codes expire after seven days, and email-confirmation and recovery codes after 30 minutes. Cleanup removes expired runtime/session/email records. Email bodies are cleared after delivery or terminal failure/expiry; shared invitation history can remain without the deleted sender’s account link.",
          "Operational and support records: our servers’ logs are kept for 30 days. Support correspondence is kept while the request is handled and, when needed, for the applicable complaint or legal-claim limitation period. Security evidence and mandatory audit records follow their specific purpose and retention rules; a 30-day application-log setting is not a limit for every provider record.",
          "Legal and billing records: only information needed for the applicable obligation or claim is retained with restricted access. Spanish commercial records can require six years and tax records generally four, subject to applicable exceptions or extensions. When you delete your account, we also ask RevenueCat, the company that checks subscriptions for us, to delete its record of you. Google Play keeps its own record of your purchases. To include other data our providers hold in an erasure request, write to support.",
          "Public demo: encrypted results are accessible for 24 hours, quota records expire after 48 hours and the session cookie lasts up to 30 days, as explained below. The theme preference remains until you clear browser storage, and the language preference for up to a year.",
        ],
        paragraphs: [
          "Backup and recovery copies expire through the provider’s rolling recovery window, rather than being edited in place when a live record is deleted. Retention is limited by that configured recovery window, except for a documented legal hold. Provider security/billing records may have separate legal retention. You can ask support which periods and exceptions apply to your request; we explain any retained information and the reason. Account deletion is not a promise of instantaneous erasure from every backup or independent copy.",
        ],
      },
      {
        id: "website",
        title: "8. Website demo, cookies and local storage",
        paragraphs: [
          "Live demo: we don’t keep your recording. The text and the tasks found in it are kept encrypted for up to 24 hours, so trying again doesn’t use another try, and are then deleted automatically. The live demo sends your recording or text to Google only when you tap Done. Nothing from it is saved to an app account.",
          "The live demo loads Cloudflare Turnstile after you open it. Cloudflare receives browser/connection signals to check automated abuse. Our essential __Host-tf-demo cookie identifies a signed browser session for the demo’s limits and lasts up to 30 days. Network limits use a coded form of your network address, which still counts as personal data.",
          "Browser/network quota records expire after 48 hours and are queued for deletion. Monthly aggregate counts, audio duration, token totals and estimated costs contain no task text or recordings.",
          "The taskflow-theme local-storage entry remembers a light/dark preference you choose until you clear it. The bare address opens the site in your browser’s language when it’s Spanish or Catalan, and in English otherwise; we never use your location for this. If you pick a language in the language switch, the taskflow-lang cookie remembers it for up to a year, like the theme, so the site opens in that language next time. We use no advertising cookies or third-party marketing analytics. Necessary security storage and a preference explicitly requested by you are not used for advertising. You can clear browser storage, although doing so may reset preferences or affect the demo; it does not necessarily remove server-side security records. Any future non-essential tracking will require its own information and consent mechanism.",
        ],
        links: [
          {
            label: "Cloudflare Turnstile privacy information",
            href: "https://www.cloudflare.com/privacypolicy/",
          },
        ],
      },
      {
        id: "permissions",
        title: "9. Device permissions and security",
        paragraphs: [
          "TaskFlow requests microphone access for recording, notifications for reminders, and relevant file/photo/camera or calendar permissions when you choose those features. Events from your phone’s calendars are shown read-only and stay on the phone: they’re never uploaded or sent to the AI. Permissions can be changed in your operating-system settings. Revocation does not erase content already submitted.",
          "We use HTTPS, passwords stored so they can’t be read back, authenticated access, membership checks, private file storage and server-side credential handling. TaskFlow is not an end-to-end encrypted vault: our servers and necessary providers can process content to provide the features. Device security, shared-device access and copies you export also matter.",
        ],
      },
      {
        id: "rights",
        title: "10. Your rights and how to contact us",
        paragraphs: [
          "Depending on the circumstances, you can request access, correction, erasure, restriction, portability of data processed by automated means on consent/contract grounds, and object to processing based on legitimate interests. Where processing relies on consent, you can withdraw it. You may complain to the Spanish Data Protection Agency (AEPD), or your competent supervisory authority, without first having to contact us.",
          "Write to taskflow.support@garbar.tech identifying the account and the right you wish to exercise. We verify identity proportionately, and do not ask for your password or payment-card number. We normally respond within one calendar month of receiving your request; a legally permitted extension of up to two additional months for complex/numerous requests will be explained within the first month. Requests are normally free.",
          "Account deletion is different from cancelling a store subscription. Our dedicated deletion page explains both. If some data cannot be erased because of a legal duty or another person’s rights, we will explain the reason and remaining retention.",
        ],
        contact: "privacy",
        links: [
          {
            label: "Request account deletion",
            href: "/delete-account/",
          },
          {
            label: "AEPD — exercise your rights and complaints",
            href: "https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos",
          },
        ],
      },
      {
        id: "age-changes",
        title: "11. Eligibility and updates",
        paragraphs: [
          "TaskFlow’s initial release is for adults aged 18 or over. It is not offered to people under 18, including its AI features. Contact us if you believe a person under 18 has provided personal information so we can assess the situation and take appropriate action, including removing the account and data where required.",
          "We will update this notice when the service or its data use changes, identifying the effective version and giving appropriate notice of material changes. A revised notice does not retrospectively authorise an incompatible use of your data.",
        ],
      },
    ],
  },
  terms: {
    title: "TaskFlow Terms and Conditions",
    description:
      "Terms and Conditions for using TaskFlow, including accounts, shared projects, dictation and subscriptions.",
    summary: [
      "TaskFlow helps you plan; you stay in control.",
      "Your content remains yours.",
      "Your statutory consumer rights are preserved.",
    ],
    sections: [
      {
        id: "operator",
        title: "1. TaskFlow and these terms",
        company: true,
        paragraphs: [
          "These Terms and Conditions describe the agreement between GARBAR, IN-TEC, S.L. and the person using TaskFlow. TaskFlow is our product name, not a separate legal entity. They cover the app and related services; the Privacy Policy separately explains personal-data processing.",
          "The current app is a private test version and the website offers a demonstration. There is no public paid website checkout or app download at present. Test purchases only: no real payment is taken, and test subscriptions can renew or end sooner than real ones. Clauses about real paid subscriptions apply only when such a purchase is actually offered and completed.",
          "Before a public account or paid contract is created, these terms and the applicable offer must be available for review. Merely reading this website or receiving an invitation does not create a paid subscription.",
        ],
      },
      {
        id: "account",
        title: "2. Accounts and eligibility",
        paragraphs: [
          "Use accurate account information, protect your sign-in credentials, and contact us if you suspect unauthorised access. Do not impersonate another person, share stolen access or use an account to get around a limit. Signing in does not guarantee that all activity is legitimate; we may verify ownership where reasonably necessary.",
          "You must be at least 18 to use TaskFlow in this initial release. A person acting for an organisation must have authority to do so. A business/team data-processing agreement, where required, must be agreed separately; these consumer terms alone are not such an agreement.",
        ],
      },
      {
        id: "service",
        title: "3. What the service provides",
        paragraphs: [
          "TaskFlow provides task/note planning, calendars, reminders, optional dictation that turns what you say into tasks, synchronisation and shared projects where enabled. Available features and any storage or AI limits are shown in the app and the offer you select. A preview or roadmap is not a promise that every planned feature is already available.",
          "Some features need a compatible device, internet connection or operating-system permissions. Offline changes synchronise when connectivity and account access allow. Reminders depend on device permissions, battery settings and operating-system delivery; review important deadlines independently. TaskFlow is not an emergency service, medical adviser or guaranteed alarm system.",
          "We may maintain or update the service for security and functionality. We will provide legally required updates and give reasonable notice of a material change affecting paid service, together with any cancellation/refund rights required by law. We do not reserve a right to remove paid functionality arbitrarily.",
        ],
      },
      {
        id: "content",
        title: "4. Your content and shared work",
        paragraphs: [
          "You retain your rights in the content you add. You give us only the permission needed to host, copy, process, synchronise and display it to you and the people you authorise, using the providers described in the Privacy Policy. This permission does not let us sell your task content or use it in advertising.",
          "Share content only if you have the necessary rights and lawful basis. Owners/administrators control membership and permissions in shared spaces. An invitation requires acceptance; it does not automatically join someone. Members may retain their own exports, so choose carefully what you share. You must not invite people for spam or upload malware or unlawful content.",
          "Do not interfere with the service, attempt unauthorised access, resell another person’s access, or deliberately evade reasonable security, file-size or usage controls. Reasonable limits protect availability; contractual limits for a paid plan must be disclosed before purchase.",
        ],
      },
      {
        id: "ai",
        title: "5. AI suggestions",
        paragraphs: [
          "AI capture is optional. It sends submitted input and relevant context to an AI provider as explained in the Privacy Policy. Output can omit, misinterpret or invent details. Check titles, dates, times, priorities, notes, recipients and project assignments before saving or sharing. An AI suggestion is not a professional recommendation or a guarantee of correctness.",
          "You remain responsible for the instructions and content you submit and how you use reviewed suggestions. This does not exclude our legal duties regarding the quality, security or conformity of the service. Do not use the demo to submit confidential or highly sensitive information.",
        ],
      },
      {
        id: "subscription",
        title: "6. Paid plans, renewal and cancellation",
        paragraphs: [
          "When real paid plans become available, the checkout will identify the plan, included features and limits, total price and applicable taxes, billing period, trial conditions and any automatic renewal before you confirm. The applicable price is the one shown in the offer and checkout.",
          "A recurring subscription renews for the disclosed period until cancelled under the purchase channel’s rules. Manage or cancel it in the Google Play account you used to buy it; follow that store’s displayed renewal deadline. Cancellation normally stops future renewal and leaves access for the period already paid, subject to refund decisions and statutory rights. Removing the app or deleting a TaskFlow account does not by itself cancel a store subscription.",
          "RevenueCat verifies subscription access; the purchasing store processes payment. A future web checkout, if introduced, will identify its payment provider and cancellation route before purchase. We do not currently take web subscription payments.",
          "Price changes for an existing subscription will be notified in advance under the applicable law and store rules, including any required approval and a chance to cancel. Contact us about duplicate purchases or inaccessible paid features; you do not have to buy the same access again merely because you use another supported device.",
        ],
      },
      {
        id: "withdrawal",
        title: "7. Withdrawal, refunds and conformity",
        paragraphs: [
          "EU/Spanish consumers generally have 14 calendar days from conclusion of a distance service contract to withdraw without giving a reason. We do not remove that right merely because you sign in, download the app or start a subscription. If you expressly ask for service to begin during that period, only a proportionate amount may be due where the statutory requirements are met.",
          "Any exception for a fully performed service or digital content supplied without a physical medium applies only where the relevant legal conditions, including the required express request/consent, acknowledgement and confirmation, have actually been satisfied. An ongoing subscription is not automatically fully performed on its first day. Store processes do not remove mandatory consumer rights.",
          "Send an unequivocal withdrawal statement to our contact, or use the purchasing store’s request channel. Include the account, purchase date and order reference, never your full card details. You may use the model below, but it is not compulsory. Where withdrawal is valid, reimbursement is due within the statutory period, normally 14 days after notification, using the original means unless lawfully agreed otherwise.",
          "Model withdrawal statement: To GARBAR, IN-TEC, S.L. at the contact/address listed on this page. I notify you that I withdraw from my contract for [TaskFlow plan/service], contracted on [date]. Account/order reference: […]. Consumer name and address: […]. Date: […]. Signature only if sent on paper.",
          "Digital services must conform to the contract. If they do not, you may have rights to correction, a price reduction or termination/refund under Spanish/EU law. No ‘all sales final’ rule overrides these rights.",
        ],
        contact: "withdrawal",
      },
      {
        id: "ending",
        title: "8. Leaving, suspension and deletion",
        paragraphs: [
          "You can delete your account in Settings → Account → Delete account, or request deletion and assistance at taskflow.support@garbar.tech without accessing the app. Review the personal-data removal and shared-content handovers before confirming. Export what you want to keep first; the app’s task export does not include attached files, which must be saved separately. Store cancellation and account deletion are separate: you do not have to buy another service or cancel first to request erasure.",
          "We may restrict access proportionately to address a serious breach, fraud, unlawful activity or a security threat. Where appropriate, we explain the reason and offer a way to contest or remedy it; urgent security action may be immediate. Statutory refund and data-access rights still apply.",
          "If we discontinue the service, we will provide reasonable notice, an appropriate opportunity to retrieve data and any reimbursement required for unused paid service. We will not claim a general right to erase your paid content without notice.",
        ],
        links: [
          {
            label: "Delete your account and associated data",
            href: "/delete-account/",
          },
          {
            label: "Privacy rights and contact",
            href: "/privacy/#rights",
          },
        ],
      },
      {
        id: "responsibility",
        title: "9. Responsibility and intellectual property",
        paragraphs: [
          "TaskFlow’s software, design and branding are protected by the rights of their respective owners. You may use them as needed to use the service; these terms do not transfer ownership. Third-party/open-source licences remain applicable.",
          "We are responsible as required by applicable law. Nothing excludes liability that cannot lawfully be excluded, including fraud, wilful misconduct, legally protected personal injury or mandatory consumer/data-protection rights. We do not impose a blanket waiver or an arbitrary liability cap on consumers.",
        ],
      },
      {
        id: "complaints",
        title: "10. Contact, applicable law and changes",
        paragraphs: [
          "Contact us with questions or complaints through the company contact below. We will provide a record of a complaint and respond within the applicable legal deadline, no later than one month for consumer complaints. You can also contact the competent consumer authority or a competent dispute-resolution body. We do not claim membership of a specific arbitration scheme unless confirmed.",
          "Spanish law applies, without depriving consumers of mandatory protections in their country of habitual residence where applicable. Disputes may be brought before the courts competent under applicable consumer/jurisdiction rules; these terms do not force a consumer to use a court in our home city.",
          "We will identify new versions and communicate material contractual changes before they take effect where required. Changes do not retroactively alter a completed purchase or remove accrued rights. The English, Spanish and Catalan versions are intended to convey the same terms; an inconsistency will not be used to reduce mandatory consumer rights.",
        ],
        contact: "privacy",
      },
    ],
  },
  legal: {
    title: "Legal notice: the company behind TaskFlow",
    description:
      "Legal notice and operator information for TaskFlow and GARBAR, IN-TEC, S.L.",
    summary: [
      "TaskFlow is the product name.",
      "GARBAR, IN-TEC, S.L. is the operator.",
      "Write to us at taskflow@garbar.tech.",
    ],
    sections: [
      {
        id: "company",
        title: "1. Operator information",
        company: true,
        paragraphs: [
          "GARBAR, IN-TEC, S.L., identified above, operates taskflow.garbar.tech and the TaskFlow service. This notice provides operator information under Spain’s Law 34/2002 on information-society services and electronic commerce. TaskFlow is the product brand, not a separate legal entity.",
          "For general enquiries, write to taskflow@garbar.tech. For help with the app, complaints, privacy rights or account deletion, write to taskflow.support@garbar.tech. You may also write to the registered address above. Automated messages use taskflow.noreply@garbar.tech; please direct enquiries to the support address.",
        ],
        contact: "privacy",
      },
      {
        id: "scope",
        title: "2. Website and product information",
        paragraphs: [
          "This site presents TaskFlow and its optional demonstrations. Public app availability, prices and features are only those expressly offered in the applicable listing or checkout. The current preview does not sell subscriptions or provide a public app download.",
          "The Terms and Conditions govern use of the service. The Privacy Policy describes personal-data processing and includes information about essential cookies and local storage. Contact us to report unlawful content, a security issue or an error in this information.",
        ],
      },
      {
        id: "rights",
        title: "3. Rights and external services",
        paragraphs: [
          "The website’s content, software and branding belong to their respective rights holders. You may access and use the site for its intended purpose and exercise rights permitted by law. You may not impersonate TaskFlow or falsely imply an endorsement.",
          "Links to third-party information identify those providers’ own services. We remain responsible for our own obligations; an external link is not a blanket exclusion of liability. Consumer and data-protection rights remain unaffected.",
        ],
      },
    ],
  },
  "delete-account": {
    title: "Delete your TaskFlow account.",
    description: "Delete in the app, or email support without signing in.",
    summary: [
      "Deleted: your account and your tasks, notes and files, on all your devices.",
      "Stays for the others: what you added to shared projects, without your name.",
      "Deleting your account doesn’t cancel TaskFlow Pro on Google Play.",
    ],
    sections: [
      {
        id: "in-app",
        title: "1. Delete from the app",
        paragraphs: [
          "Open Settings → Account → Delete account. The screen identifies the account, counts the personal tasks, notes and files to remove, and shows the shared content that will stay and who will receive ownership. You can save a copy of your tasks first; attached files are not included in that export and must be saved separately.",
          "Confirm with your password or with the same Google account used to sign in. Deletion needs an internet connection. Nothing is deleted just by opening this screen. If shared ownership changes before confirmation, the app asks you to review the updated plan. Once the server confirms deletion, the app signs you out and shows confirmation; this cannot be undone.",
        ],
      },
      {
        id: "request",
        title: "2. Request deletion by email",
        paragraphs: [
          "Email taskflow.support@garbar.tech, preferably from your account’s email address, and identify the TaskFlow account to delete. You can use this route if you have uninstalled the app, cannot sign in, need help, or want to include data held by our service providers. You do not need to give a reason, purchase anything or pay for an ordinary request.",
          "If you no longer control the account email, explain that so we can verify ownership proportionately. Do not send passwords, payment-card numbers or identity documents unless a necessary, secure verification process has been agreed.",
          "Opening your email application does not send the request automatically. This page does not instantly delete an account: review the message and send it. TaskFlow Support handles it on behalf of GARBAR, IN-TEC, S.L.",
        ],
        contact: "deletion",
      },
      {
        id: "scope",
        title: "3. What is deleted and what stays",
        bullets: [
          "Deleted, on all your devices: your account, your tasks, notes and files, and projects only you use. That includes your sign-in, Google link, sessions, project and group memberships, notification settings and your count of free dictations. We also ask RevenueCat, the company that checks subscriptions for us, to delete its record of you.",
          "Stays for the others: tasks and files you added to shared projects. Your name is taken off them, “Created by” included, but what you wrote inside them doesn’t change. Projects and groups you own pass to another member; the app tells you who before you confirm. Ask support about personal details inside shared content.",
          "Not deleted by the app: Google Play’s own record of your purchases, your emails with support, security logs, and backups, which expire on their own. Ask support to delete what can be deleted; we’ll tell you what must be kept, why and for how long. We can’t delete copies other people saved.",
        ],
      },
      {
        id: "timing",
        title: "4. Timing and confirmation",
        paragraphs: [
          "In the app, your account is deleted as soon as you confirm, and its files right after (if one can’t be removed then, we follow it up). You see the confirmation in the app; no email is sent. If the app shows an error, don’t assume it worked: try again or write to support.",
          "For requests to support, we normally respond within one calendar month of receiving the request. A permitted extension of up to two additional months for complexity or numerous requests is explained within the first month. We verify ownership, erase data without undue delay where required, and confirm the outcome. If information must remain, we explain its purpose, legal reason and retention period or criteria, and how to challenge the decision.",
          "Shared content remains for the continuing shared space as described above. Backups expire on their own. Restricted records needed for a specific legal obligation, security investigation or claim remain only for that purpose’s applicable period. The Privacy Policy explains retention in more detail.",
        ],
        links: [
          {
            label: "Storage and retention",
            href: "/privacy/#retention",
          },
        ],
      },
      {
        id: "subscription",
        title: "5. Subscriptions and device copies",
        paragraphs: [
          "Deleting your account doesn’t cancel TaskFlow Pro on Google Play. Cancel renewal in the store account where you subscribed; contact support if you need help. Cancellation is not a condition for requesting deletion. Test purchases only: no real payment is taken.",
          "Save anything you want to keep before deletion. The app clears its own local account copy after confirmed deletion, and other connected devices clear theirs on their next contact with the service. Remove independent exports, external downloads and device backups separately. Your Google account isn’t deleted.",
        ],
        links: [
          {
            label: "Manage Google Play subscriptions",
            href: "https://support.google.com/googleplay/answer/7018481",
          },
        ],
      },
      {
        id: "other-rights",
        title: "6. Other privacy requests",
        paragraphs: [
          "You may request access, a copy, correction or deletion of particular data without closing your account. The Privacy Policy explains your rights and how to complain to the AEPD or your competent supervisory authority.",
        ],
        links: [
          {
            label: "Read the Privacy Policy",
            href: "/privacy/#rights",
          },
        ],
      },
    ],
  },
};

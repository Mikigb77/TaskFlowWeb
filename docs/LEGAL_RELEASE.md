# TaskFlow legal documents

The current Privacy Policy, Terms and Conditions, Legal Notice and account-deletion instructions are effective **6 November 2026**. The owner requested their publication-ready form after implementing in-app account deletion. All three translations describe the current service; there is no draft banner or deferred-policy language.

## Edit and publish

The pages are `/privacy/`, `/terms/`, `/legal/` and `/delete-account/`. Prefix `/es` or `/ca` for Spanish or Catalan. They render as public HTML without login or JavaScript.

- Company facts and effective version: `src/content/legal/company.json`.
- Text: `src/content/legal/en.ts`, `es.ts`, `ca.ts`.
- Renderer and controls: `src/components/LegalPage.tsx`, `src/content/legal/index.ts`.
- Checks: `npm run legal:check`, `npm run check`, `npm run build`, then `npm test -- tests/legal.spec.ts tests/website.spec.ts` against the built preview.

`legal:check` validates identity, contacts, version and the owner's publication decision. It does not certify contracts, GDPR compliance or app-store approval. Those are operational responsibilities, not booleans a build can prove. Indexing follows `SITE_INDEXABLE`. The normal website deployment script publishes the selected `origin/main` commit after review/merge; local changes on `dev` are not automatically deployed by the backend script.

## Identity and contact

GARBAR, IN-TEC, S.L. — NIF B56760374. Registered office: Carrer Sant Antoni Mª Claret, 24, 3ª planta, 08037 Barcelona, España. Registry: Societat inscrita al Registre Mercantil de Barcelona, Tom 49105, Foli 130, Full 607875, Inscripció 1.

General contact is `taskflow@garbar.tech`; support, privacy and deletion use `taskflow.support@garbar.tech`. Both are active Google Workspace aliases of the company mailbox. Automated invitations and recovery use Resend, from `TaskFlow <taskflow.noreply@garbar.tech>`, with replies directed to support. The no-reply sender is not the privacy contact. Family members' names, personal emails and telephone have not been published.

## Evidence behind deletion wording

The sibling repository implements `Backend/core/account_deletion.py` and `App/lib/screens/delete_account_screen.dart`. The path is Settings → Account → Delete account, with translated labels. The API previews counts and named ownership handovers, reauthenticates with password or Google, checks the preview again, and removes the user and personal database content transactionally. File removal follows commit. The app clears local data and returns to sign-in after confirmation. It sends no automatic confirmation email.

Continuing shared projects retain tasks, notes and attachments for remaining members. Ownership transfers appear before confirmation. Membership, assignments and identifying activity attribution are removed. The policy does not claim every piece of shared text is anonymised. Requests about personal information in retained shared content go to support.

The operation also deletes the RevenueCat customer once the deletion has committed, on a best-effort basis: a failure is logged and never undoes or blocks the deletion. It does not touch store history or edit backups in place. File deletion errors are logged and require follow-up. These limits are stated publicly; do not replace them with an “all data immediately erased” promise.

The website email button opens a translated message for the user to review and send; it does not transmit email or delete an account. Users can request deletion without reinstalling, signing in, giving a reason, purchasing or first cancelling a subscription.

## Evidence behind meeting-notes and AI wording

Version 2026-11-06 adds meeting notes (the app repo's `App/docs/MEETING_NOTES.md`, MN-34, and `Backend/docs/MEETINGS.md`) and moves §4 to Vertex AI only. The owner asked for it to be published on 2026-11-05, and it went out on 2026-11-06.

- Meeting notes are Pro only, with up to 20 hours a month (240 five-minute pieces, `AI_MEETING_PIECES_PER_MONTH`). The app sends pieces of about 5 minutes while recording, and keeps each piece on the phone until the server confirms it.
- The server transcribes each piece on Vertex AI, stores the text and drops the audio. Once every piece is in, it writes the notes. The app saves them as an ordinary note, then deletes the meeting on the server: its pieces' text, chapter notes and row (MN-24). Discard deletes the pieces on the phone at once, and the meeting on the server as soon as the phone reaches it (MN-25; phase `discarding` in `App/lib/models/meeting.dart`).
- Whatever is left of a meeting on the server, finished or not, is deleted 30 days after its last piece arrived, and so are final notes the app never acknowledged (MN-27, `sweep()` in `Backend/core/meetings.py`, run by `maintain_staging`). A recording the app asks about and that is left unanswered is finished into a note on the phone 7 days after the app first asks about it (MN-26, `unanswered` in `App/lib/services/meeting_store.dart`): one that stopped before Stop was pressed (the app closed or the phone switched off), and one that was nearly all silence when Stop was pressed, which the app keeps and asks about (“Almost nothing was heard. Make notes anyway?”; `stopQuiet()` in `meeting_store.dart`, phase `interrupted`, UX-2717). Account deletion deletes meetings, because the rows cascade from the user.
- Every AI call goes through Vertex AI with application credentials, and there is no Gemini API key (the app repo's commit `aa627da`, 2026-11-05). This answers WD12's "paid or free Gemini" half. Its backup half is unchanged.
- The training sentence rests on Google Cloud's Service Specific Terms (the generative AI training restriction). Caching, abuse monitoring and global processing are stated as possible, not quantified.

## Operating the published policy

Monitor support. Record receipt, verify ownership proportionately, carry out applicable erasure and confirm the outcome. Respond within one calendar month; explain any legally permitted extension within the first month. Explain specific lawful retention exceptions. Never request passwords or full card numbers by email.

For associated-data requests, include relevant processors, a check that the RevenueCat customer was deleted with the account (best effort; a failure is logged and never blocks the deletion), personal file failures and personal information in shared content. These actions need operational handling; the website does not automate them. Preserve only the minimal record needed to handle and demonstrate the request.

Ordinary Cloud Run application logs were checked at a 30-day retention setting on 16 October. This is not the period for all mandatory audit, billing or provider-security records. Recovery copies use the provider's configured rolling window. Keep backup windows, processor arrangements and restoration procedures in the operational inventory, and explain applicable retention criteria to requesters. Completed tasks are not automatically purged at 30/90 days.

The public demo keeps encrypted retrievable results for 24 hours, quota records until 48-hour expiry followed by asynchronous TTL deletion, and a signed session cookie up to 30 days. Aggregate usage/cost data contains no task text or recording. Recheck `src/lib/voice/` after changes.

Before introducing real paid subscriptions, update the offer, benefits, price/taxes, renewal and cancellation terms, consumer contact information and durable contract confirmation. TRLGDCU Article 97 includes a business telephone for distance-contract information; use a dedicated business contact rather than a family number. Current policies identify no-charge staging purchases and no web checkout. Age eligibility, app disclosures/legal links, processor agreements, backup recovery tests and store Data Safety declarations remain part of operating and releasing the product. Publishing these pages does not certify every future release requirement.

## Primary references

- [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj): information, retention criteria, erasure, processors and international transfers.
- [Spanish LSSI](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758): operator information and device storage.
- [Spanish consumer law](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555): complaints, pre-contract information, withdrawal and digital-service conformity.
- [LOPDGDD](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673).
- [AEPD erasure guidance](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-supresion-al-olvido).
- [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en-GB) and [Apple account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion).
- [Google Cloud service terms](https://cloud.google.com/terms/service-terms) (Vertex AI), [Google Cloud processing terms](https://cloud.google.com/terms/data-processing-addendum) and [Google Workspace processing terms](https://workspace.google.com/terms/dpa_terms.html).

Keep translations and effective dates aligned. Preserve mandatory consumer rights and do not reintroduce the obsolete EU ODR platform link.

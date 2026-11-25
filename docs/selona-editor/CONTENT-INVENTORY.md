# Content inventory

Every piece of content on the site, its content key, and what kind it is. Generated from `content/defaults.json` (the repo default). Lists (arrays) can have items added, removed and reordered.

Top-level groups: `shared` (nav, footer, buttons, call-to-action band, FAQs, contact form messages, logo, site title/description), `home`, `pricing`, `contact`, `security`, `privacy`, `applyNow`, `notFound`.

| Key | Kind | Default value |
|---|---|---|
| `shared.meta.title` | text | Selona \| The Control Layer for Finance AI |
| `shared.meta.titleTemplate` | text | %s \| Selona |
| `shared.meta.description` | text | ThinkAIWork turns company context, source files, workflows, and templates into structured,… |
| `shared.brand.logoSrc` | image | /brand/selona-logo-official.svg |
| `shared.brand.logoAlt` | text | Selona |
| `shared.brand.homeLabel` | text | Selona home |
| `shared.contact.email` | text | info@selona.ai |
| `shared.contact.bookingUrl` | setting (not edited) | https://meetings-eu1.hubspot.com/rahul4 |
| `shared.contact.enquiriesLabel` | text | For enquiries: |
| `shared.nav.links.0.label` | text | Platform |
| `shared.nav.links.0.href` | setting (not edited) | /#control-layer |
| `shared.nav.links.1.label` | text | Use cases |
| `shared.nav.links.1.href` | setting (not edited) | /#use-cases |
| `shared.nav.links.2.label` | text | Pricing |
| `shared.nav.links.2.href` | setting (not edited) | /pricing |
| `shared.nav.contact` | text | Contact |
| `shared.nav.openMenu` | text | Open menu |
| `shared.nav.closeMenu` | text | Close menu |
| `shared.nav.mobileLinks.0.label` | text | Contact |
| `shared.nav.mobileLinks.0.href` | setting (not edited) | /contact |
| `shared.nav.mobileLinks.1.label` | text | Book a walkthrough |
| `shared.nav.mobileLinks.1.href` | setting (not edited) | /contact |
| `shared.footer.tagline` | text | ThinkAIWork by Selona — controlled AI workflows for finance teams. |
| `shared.footer.columns.0.title` | text | Platform |
| `shared.footer.columns.0.links.0.label` | text | Problem |
| `shared.footer.columns.0.links.0.href` | setting (not edited) | /#problem |
| `shared.footer.columns.0.links.1.label` | text | Control layer |
| `shared.footer.columns.0.links.1.href` | setting (not edited) | /#control-layer |
| `shared.footer.columns.0.links.2.label` | text | Product layers |
| `shared.footer.columns.0.links.2.href` | setting (not edited) | /#layers |
| `shared.footer.columns.0.links.3.label` | text | Use cases |
| `shared.footer.columns.0.links.3.href` | setting (not edited) | /#use-cases |
| `shared.footer.columns.1.title` | text | Company |
| `shared.footer.columns.1.links.0.label` | text | Pricing |
| `shared.footer.columns.1.links.0.href` | setting (not edited) | /pricing |
| `shared.footer.columns.1.links.1.label` | text | Contact |
| `shared.footer.columns.1.links.1.href` | setting (not edited) | /contact |
| `shared.footer.columns.1.links.2.label` | text | Privacy |
| `shared.footer.columns.1.links.2.href` | setting (not edited) | /privacy |
| `shared.footer.columns.2.title` | text | Resources |
| `shared.footer.columns.2.links.0.label` | text | FAQs |
| `shared.footer.columns.2.links.0.href` | setting (not edited) | /#faq |
| `shared.footer.columns.2.links.1.label` | text | Security review |
| `shared.footer.columns.2.links.1.href` | setting (not edited) | /security |
| `shared.footer.columns.2.links.2.label` | text | Walkthrough |
| `shared.footer.columns.2.links.2.href` | setting (not edited) | /contact |
| `shared.footer.enquiriesTitle` | text | Enquiries |
| `shared.footer.bottomLine` | text | Selona. Finance control infrastructure for AI. |
| `shared.footer.privacy` | text | Privacy |
| `shared.cta.eyebrow` | text | SEE THE CONTROL LAYER |
| `shared.cta.heading` | text | Book a ThinkAIWork walkthrough. |
| `shared.cta.sub` | text | See how controlled AI workflows can support board reporting, variance analysis, reconcilia… |
| `shared.cta.primary` | text | Request a demo |
| `shared.cta.secondary` | text | See how it works |
| `shared.cta.calendarLink` | text | Prefer a calendar link? Book directly → |
| `shared.faq.heading` | text | Frequently asked questions |
| `shared.faq.sub` | text | Find some quick answers to the most common questions. |
| `shared.faq.items.0.q` | text | What is ThinkAIWork? |
| `shared.faq.items.0.a` | text | ThinkAIWork is Selona's AI-agnostic workspace for finance teams and fractional CFOs. It tu… |
| `shared.faq.items.1.q` | text | How is it different from generic AI tools? |
| `shared.faq.items.1.a` | text | Generic tools start from a blank prompt. ThinkAIWork lets teams define context, versions, … |
| `shared.faq.items.2.q` | text | Which finance workflows does it support first? |
| `shared.faq.items.2.a` | text | The private beta is focused on recurring CFO work such as board commentary, variance analy… |
| `shared.faq.items.3.q` | text | Can we change AI models later? |
| `shared.faq.items.3.a` | text | Yes. ThinkAIWork is designed so context, skills, and templates can be reused across Anthro… |
| `shared.faq.items.4.q` | text | What security information is available? |
| `shared.faq.items.4.a` | text | Security documentation is available on request. Public pages avoid unconfirmed certificati… |
| `shared.form.sending` | text | Sending… |
| `shared.form.submit` | text | Submit |
| `shared.form.invalid` | text | Please complete each field with a valid work email before submitting. |
| `shared.form.errorBefore` | text | Something went wrong sending your request. Please try again, or write to us directly at |
| `shared.form.success` | text | Thanks — your request has been received. We will be in touch shortly. |
| `home.hero.eyebrow` | text | ThinkAIWork by Selona |
| `home.hero.headline` | text | The control layer starting with finance AI |
| `home.hero.subheadline` | text | ThinkAIWork turns company context, source files, workflows, and templates into structured,… |
| `home.hero.primary` | text | See how it works |
| `home.hero.secondary` | text | View use cases |
| `home.hero.videoSrc` | video | /brand/selona-loop-desktop.mp4 |
| `home.hero.videoMobileSrc` | video | /brand/selona-loop-mobile.mp4 |
| `home.credibility.label` | text | ThinkAIWork credibility |
| `home.credibility.items.0` | text | Private beta |
| `home.credibility.items.1` | text | 10 fractional CFOs |
| `home.credibility.items.2` | text | 3 partner channels |
| `home.credibility.items.3` | text | Model-agnostic architecture |
| `home.showcase.eyebrow` | text | Inside ThinkAIWork |
| `home.showcase.lead` | text | See how finance workflows become structured, repeatable, and auditable. |
| `home.showcase.imageSrc` | image | /media/thinkaiwork-context-accelerator.jpeg |
| `home.showcase.imageAlt` | text | ThinkAIWork context accelerator workflow preview |
| `home.problems.eyebrow` | text | THE PROBLEM |
| `home.problems.heading` | text | Generic AI was not built for finance control. |
| `home.problems.intro` | text | Finance teams do not just need faster answers. They need repeatable context, consistent ou… |
| `home.problems.surfaceLabel` | text | Blank prompt surface |
| `home.problems.surfaceTitle` | text | Generic AI starts without finance controls. |
| `home.problems.items.0.name` | text | Generic output |
| `home.problems.items.0.body` | text | No board voice, no company context, no competitive edge. |
| `home.problems.items.1.name` | text | Context drift |
| `home.problems.items.1.body` | text | Institutional knowledge gets re-explained every month — then disappears again. |
| `home.problems.items.2.name` | text | No fixed structure |
| `home.problems.items.2.body` | text | Different analyst, different output. No repeatability, no trust. |
| `home.problems.items.3.name` | text | Exploding token cost |
| `home.problems.items.3.body` | text | The same context is resent every call, with little visibility into spend. |
| `home.problems.items.4.name` | text | Model lock-in |
| `home.problems.items.4.body` | text | Prompts, workflows, and outputs become trapped inside one vendor. |
| `home.problems.items.5.name` | text | Cluttered context |
| `home.problems.items.5.body` | text | Files, teams, entities, and geographies become impossible to govern. |
| `home.problems.note` | text | The issue is not intelligence. It is the missing control structure around context, cost, e… |
| `home.mechanism.eyebrow` | text | CONTROL LAYER |
| `home.mechanism.heading` | text | Controlled inputs in. Structured outputs out. |
| `home.mechanism.sub` | text | ThinkAIWork gives finance teams a control layer for what goes into AI, how it is used, and… |
| `home.mechanism.inputsEyebrow` | text | Controlled source |
| `home.mechanism.inputsTitle` | text | Inputs |
| `home.mechanism.inputBadge` | text | Input |
| `home.mechanism.inputs.0` | text | Company context |
| `home.mechanism.inputs.1` | text | KPI definitions |
| `home.mechanism.inputs.2` | text | Board style |
| `home.mechanism.inputs.3` | text | Stakeholder red lines |
| `home.mechanism.inputs.4` | text | Source files |
| `home.mechanism.inputs.5` | text | Budget limits |
| `home.mechanism.inputs.6` | text | Output rules |
| `home.mechanism.layerEyebrow` | text | ThinkAIWork |
| `home.mechanism.layerTitle` | text | Control layer |
| `home.mechanism.layerBody` | text | Context, skills, templates, model rules, and budget logic sit between finance data and AI … |
| `home.mechanism.layer.0` | text | Context |
| `home.mechanism.layer.1` | text | Versioning |
| `home.mechanism.layer.2` | text | Skills |
| `home.mechanism.layer.3` | text | Templates |
| `home.mechanism.layer.4` | text | Model routing |
| `home.mechanism.artifacts.0.label` | text | Version |
| `home.mechanism.artifacts.0.title` | text | Context v2.4 approved |
| `home.mechanism.artifacts.0.meta` | text | Reusable |
| `home.mechanism.artifacts.0.tone` | setting (not edited) | blue |
| `home.mechanism.artifacts.1.label` | text | Policy |
| `home.mechanism.artifacts.1.title` | text | Board output template locked |
| `home.mechanism.artifacts.1.meta` | text | Auditable |
| `home.mechanism.artifacts.1.tone` | setting (not edited) | green |
| `home.mechanism.outputsEyebrow` | text | Structured return |
| `home.mechanism.outputsTitle` | text | Outputs |
| `home.mechanism.outputBadge` | text | Output |
| `home.mechanism.outputs.0` | text | Board commentary |
| `home.mechanism.outputs.1` | text | Variance analysis |
| `home.mechanism.outputs.2` | text | VAT/GST reconciliation |
| `home.mechanism.outputs.3` | text | Stakeholder updates |
| `home.mechanism.outputs.4` | text | Audit-ready summaries |
| `home.mechanism.outputs.5` | text | Forecast narratives |
| `home.mechanism.outputs.6` | text | Management reports |
| `home.workflow.eyebrow` | text | WORKFLOW PROOF |
| `home.workflow.heading` | text | A finance workflow, end to end. |
| `home.workflow.sub` | text | Example: VAT/GST reconciliation, grounded in source files and reusable finance context. |
| `home.workflow.steps.0.step` | text | 01 |
| `home.workflow.steps.0.label` | text | Source file |
| `home.workflow.steps.0.body` | text | Upload the VAT report, ledger extract, or reconciliation workbook. |
| `home.workflow.steps.0.imageSrc` | image | /product/input-data.webp |
| `home.workflow.steps.0.imageAlt` | text | ThinkAIWork input data workspace |
| `home.workflow.steps.0.artifact.label` | text | Source |
| `home.workflow.steps.0.artifact.title` | text | Ledger extract uploaded |
| `home.workflow.steps.0.artifact.meta` | text | Linked |
| `home.workflow.steps.0.artifact.tone` | setting (not edited) | blue |
| `home.workflow.steps.1.step` | text | 02 |
| `home.workflow.steps.1.label` | text | Company context |
| `home.workflow.steps.1.body` | text | Apply entity rules, tax periods, chart of accounts, and review preferences. |
| `home.workflow.steps.1.imageSrc` | image | /product/build-context.webp |
| `home.workflow.steps.1.imageAlt` | text | ThinkAIWork company context builder |
| `home.workflow.steps.1.artifact.label` | text | Context |
| `home.workflow.steps.1.artifact.title` | text | Entity and review rules applied |
| `home.workflow.steps.1.artifact.meta` | text | v2.4 |
| `home.workflow.steps.1.artifact.tone` | setting (not edited) | amber |
| `home.workflow.steps.2.step` | text | 03 |
| `home.workflow.steps.2.label` | text | Finance skill |
| `home.workflow.steps.2.body` | text | Run the reusable reconciliation workflow with approved model routing. |
| `home.workflow.steps.2.imageSrc` | image | /product/skills-plugins.webp |
| `home.workflow.steps.2.imageAlt` | text | ThinkAIWork reusable finance skill builder |
| `home.workflow.steps.2.artifact.label` | text | Skill |
| `home.workflow.steps.2.artifact.title` | text | VAT/GST workflow selected |
| `home.workflow.steps.2.artifact.meta` | text | Approved |
| `home.workflow.steps.2.artifact.tone` | setting (not edited) | navy |
| `home.workflow.steps.3.step` | text | 04 |
| `home.workflow.steps.3.label` | text | Auditable output |
| `home.workflow.steps.3.body` | text | Return a structured summary with source links, exceptions, and review notes. |
| `home.workflow.steps.3.imageSrc` | image | /product/auditable-output.webp |
| `home.workflow.steps.3.imageAlt` | text | ThinkAIWork auditable output summary with exceptions and source links |
| `home.workflow.steps.3.artifact.label` | text | Output |
| `home.workflow.steps.3.artifact.title` | text | Exceptions and evidence ready |
| `home.workflow.steps.3.artifact.meta` | text | Audit |
| `home.workflow.steps.3.artifact.tone` | setting (not edited) | green |
| `home.layers.eyebrow` | text | SIX PRODUCT LAYERS |
| `home.layers.heading` | text | Every layer is owned by your finance team. |
| `home.layers.sub` | text | ThinkAIWork is not a black box. Your team defines the rules, context, workflows, templates… |
| `home.layers.imageSrc` | image | /product/visual-context-builder.svg |
| `home.layers.imageAlt` | text | ThinkAIWork context builder product visual |
| `home.layers.items.0.step` | text | 01 |
| `home.layers.items.0.name` | text | Setup rules |
| `home.layers.items.0.body` | text | Define how ThinkAIWork should behave before any workflow runs. |
| `home.layers.items.0.visualSrc` | image | /product/visual-context-builder.svg |
| `home.layers.items.0.visualAlt` | text | Setup rules product visual |
| `home.layers.items.1.step` | text | 02 |
| `home.layers.items.1.name` | text | Build context |
| `home.layers.items.1.body` | text | Encode company voice, KPIs, policies, source files, board style, and stakeholder sensitivi… |
| `home.layers.items.1.visualSrc` | image | /product/visual-version-history.svg |
| `home.layers.items.1.visualAlt` | text | Build context product visual |
| `home.layers.items.2.step` | text | 03 |
| `home.layers.items.2.name` | text | Version context |
| `home.layers.items.2.body` | text | Update sponsor priorities, board preferences, assumptions, and operating context once — th… |
| `home.layers.items.2.visualSrc` | image | /product/visual-audit-trail.svg |
| `home.layers.items.2.visualAlt` | text | Version context product visual |
| `home.layers.items.3.step` | text | 04 |
| `home.layers.items.3.name` | text | Optimise tokens |
| `home.layers.items.3.body` | text | Compress and route context so recurring workflows stay inside budget. |
| `home.layers.items.3.visualSrc` | image | /product/visual-token-budget.svg |
| `home.layers.items.3.visualAlt` | text | Optimise tokens product visual |
| `home.layers.items.4.step` | text | 05 |
| `home.layers.items.4.name` | text | Package skills |
| `home.layers.items.4.body` | text | Turn repeat finance tasks into reusable workflows. |
| `home.layers.items.4.visualSrc` | image | /product/visual-model-routing.svg |
| `home.layers.items.4.visualAlt` | text | Package skills product visual |
| `home.layers.items.5.step` | text | 06 |
| `home.layers.items.5.name` | text | Control outputs |
| `home.layers.items.5.body` | text | Define structure, calculations, tone, evidence, and approval requirements. |
| `home.layers.items.5.visualSrc` | image | /product/visual-output-template.svg |
| `home.layers.items.5.visualAlt` | text | Control outputs product visual |
| `home.layers.modelFlex` | text | Start on Claude. Run Anthropic, OpenAI, or local models without rebuilding context. |
| `home.layers.models.0` | text | Claude |
| `home.layers.models.1` | text | OpenAI |
| `home.layers.models.2` | text | Local |
| `home.useCases.eyebrow` | text | USE CASES |
| `home.useCases.heading` | text | Built for recurring finance work. |
| `home.useCases.sub` | text | Each workflow becomes a reusable artifact, not a one-off prompt. |
| `home.useCases.items.0.name` | text | Board deck commentary |
| `home.useCases.items.0.label` | text | Board |
| `home.useCases.items.0.title` | text | Commentary pack |
| `home.useCases.items.0.meta` | text | Template |
| `home.useCases.items.0.tone` | setting (not edited) | blue |
| `home.useCases.items.1.name` | text | Variance analysis |
| `home.useCases.items.1.label` | text | Variance |
| `home.useCases.items.1.title` | text | Driver narrative |
| `home.useCases.items.1.meta` | text | Source |
| `home.useCases.items.1.tone` | setting (not edited) | amber |
| `home.useCases.items.2.name` | text | VAT/GST reconciliation |
| `home.useCases.items.2.label` | text | VAT/GST |
| `home.useCases.items.2.title` | text | Exception log |
| `home.useCases.items.2.meta` | text | Audit |
| `home.useCases.items.2.tone` | setting (not edited) | green |
| `home.useCases.items.3.name` | text | Stakeholder updates |
| `home.useCases.items.3.label` | text | Update |
| `home.useCases.items.3.title` | text | Stakeholder memo |
| `home.useCases.items.3.meta` | text | Review |
| `home.useCases.items.3.tone` | setting (not edited) | navy |
| `home.useCases.items.4.name` | text | Management accounts |
| `home.useCases.items.4.label` | text | Accounts |
| `home.useCases.items.4.title` | text | Close summary |
| `home.useCases.items.4.meta` | text | Monthly |
| `home.useCases.items.4.tone` | setting (not edited) | blue |
| `home.useCases.items.5.name` | text | Forecast commentary |
| `home.useCases.items.5.label` | text | Forecast |
| `home.useCases.items.5.title` | text | Scenario notes |
| `home.useCases.items.5.meta` | text | Model |
| `home.useCases.items.5.tone` | setting (not edited) | amber |
| `home.useCases.items.6.name` | text | Audit evidence packs |
| `home.useCases.items.6.label` | text | Evidence |
| `home.useCases.items.6.title` | text | Support pack |
| `home.useCases.items.6.meta` | text | Linked |
| `home.useCases.items.6.tone` | setting (not edited) | green |
| `home.useCases.items.7.name` | text | CFO operating reviews |
| `home.useCases.items.7.label` | text | Review |
| `home.useCases.items.7.title` | text | CFO operating view |
| `home.useCases.items.7.meta` | text | Reusable |
| `home.useCases.items.7.tone` | setting (not edited) | navy |
| `home.trust.eyebrow` | text | TRUST AND CONTROL |
| `home.trust.heading` | text | Designed for outputs you can defend. |
| `home.trust.items.0` | text | Source-linked outputs |
| `home.trust.items.1` | text | Context versioning |
| `home.trust.items.2` | text | Template-controlled structure |
| `home.trust.items.3` | text | Token budget visibility |
| `home.trust.items.4` | text | Model flexibility |
| `home.trust.items.5` | text | Workspace access review |
| `home.trust.items.6` | text | Approval-ready workflows |
| `home.trust.items.7` | text | Security documentation available on request |
| `home.trust.evidenceEyebrow` | text | Output evidence |
| `home.trust.evidenceTitle` | text | Board commentary |
| `home.trust.evidenceBadge` | text | Review ready |
| `home.trust.artifacts.0.label` | text | Source |
| `home.trust.artifacts.0.title` | text | Ledger extract line 184 linked |
| `home.trust.artifacts.0.meta` | text | Evidence |
| `home.trust.artifacts.0.tone` | setting (not edited) | green |
| `home.trust.artifacts.1.label` | text | Template |
| `home.trust.artifacts.1.title` | text | Board voice and structure locked |
| `home.trust.artifacts.1.meta` | text | v1.8 |
| `home.trust.artifacts.1.tone` | setting (not edited) | blue |
| `home.trust.artifacts.2.label` | text | Model |
| `home.trust.artifacts.2.title` | text | Approved routing policy used |
| `home.trust.artifacts.2.meta` | text | Policy |
| `home.trust.artifacts.2.tone` | setting (not edited) | navy |
| `home.trust.controlsEyebrow` | text | Control state |
| `home.trust.controls.0` | text | Source links |
| `home.trust.controls.1` | text | Version history |
| `home.trust.controls.2` | text | Access review |
| `home.trust.controls.3` | text | Approval trail |
| `home.trust.controlsNote` | text | Finance teams can defend how each answer was shaped, which source was used, and what appro… |
| `home.beta.eyebrow` | text | PRIVATE BETA |
| `home.beta.heading` | text | Private beta with finance operators. |
| `home.beta.sub` | text | ThinkAIWork is being shaped with fractional CFOs and finance teams turning recurring finan… |
| `home.beta.stats.0.value` | text | 10 |
| `home.beta.stats.0.label` | text | Fractional CFOs using the platform |
| `home.beta.stats.1.value` | text | 3 |
| `home.beta.stats.1.label` | text | Partner channels signed |
| `home.beta.signalEyebrow` | text | Early signal |
| `home.beta.feedback` | text | Early user feedback: ThinkAIWork gives us a clearer audit trail before external review. |
| `home.beta.testimonialsEyebrow` | text | Early customer testimonials |
| `home.beta.testimonials.0.quote` | text | With ThinkAIWork I can expand beyond my traditional CFO role into operations too. |
| `home.beta.testimonials.0.attribution` | text | Fractional CFO, early user |
| `home.beta.testimonials.1.quote` | text | The platform truly drives a lot of value — I don’t have to pay premium dollars to auditors… |
| `home.beta.testimonials.1.attribution` | text | CFO, enterprise pilot |
| `pricing.meta.title` | text | Pricing |
| `pricing.meta.description` | text | Packages are shaped around workflow scope, context complexity, integrations, and support r… |
| `pricing.eyebrow` | text | PRICING |
| `pricing.heading` | text | Choose the right starting point for your finance workflows. |
| `pricing.sub` | text | Packages are shaped around workflow scope, context complexity, integrations, and support r… |
| `pricing.tiers.0.name` | text | Pilot |
| `pricing.tiers.0.model` | text | Start |
| `pricing.tiers.0.cta` | text | Discuss a pilot |
| `pricing.tiers.0.description` | text | For one finance team starting with one controlled workflow. |
| `pricing.tiers.0.features.0` | text | Context setup |
| `pricing.tiers.0.features.1` | text | One use-case workflow |
| `pricing.tiers.0.features.2` | text | Output template |
| `pricing.tiers.0.features.3` | text | Guided onboarding |
| `pricing.tiers.0.features.4` | text | Demo workspace |
| `pricing.tiers.0.features.5` | text | Initial support |
| `pricing.tiers.0.highlighted` | setting (not edited) | false |
| `pricing.tiers.1.name` | text | Team |
| `pricing.tiers.1.model` | text | Standardize |
| `pricing.tiers.1.cta` | text | Scope workflows |
| `pricing.tiers.1.description` | text | For finance teams standardizing recurring workflows. |
| `pricing.tiers.1.features.0` | text | Shared context library |
| `pricing.tiers.1.features.1` | text | Multiple workflows |
| `pricing.tiers.1.features.2` | text | Skills and plugin support |
| `pricing.tiers.1.features.3` | text | Versioning |
| `pricing.tiers.1.features.4` | text | Token budget controls |
| `pricing.tiers.1.features.5` | text | Workspace access planning |
| `pricing.tiers.1.features.6` | text | Priority support |
| `pricing.tiers.1.highlighted` | setting (not edited) | true |
| `pricing.tiers.2.name` | text | Enterprise |
| `pricing.tiers.2.model` | text | Scale |
| `pricing.tiers.2.cta` | text | Plan deployment |
| `pricing.tiers.2.description` | text | For multi-entity finance teams and partner-led deployments. |
| `pricing.tiers.2.features.0` | text | Custom integrations |
| `pricing.tiers.2.features.1` | text | Security review support |
| `pricing.tiers.2.features.2` | text | Model policy configuration |
| `pricing.tiers.2.features.3` | text | Managed services |
| `pricing.tiers.2.features.4` | text | Dedicated onboarding |
| `pricing.tiers.2.features.5` | text | Custom commercial terms |
| `pricing.tiers.2.highlighted` | setting (not edited) | false |
| `pricing.note` | text | Pricing depends on seats, context complexity, workflows, integrations, and support require… |
| `contact.meta.title` | text | Contact |
| `contact.meta.description` | text | See how controlled AI workflows can support board reporting, variance analysis, reconcilia… |
| `contact.eyebrow` | text | CONTACT |
| `contact.heading` | text | Book a ThinkAIWork walkthrough. |
| `contact.sub` | text | See how controlled AI workflows can support board reporting, variance analysis, reconcilia… |
| `contact.coverTitle` | text | What we will cover |
| `contact.coverItems.0` | text | Your first recurring finance workflow |
| `contact.coverItems.1` | text | Context and source-file setup |
| `contact.coverItems.2` | text | Output templates and audit trail needs |
| `contact.coverItems.3` | text | Approved model and deployment preferences |
| `contact.submit` | text | Request my walkthrough |
| `contact.labels.name` | text | Name |
| `contact.labels.email` | text | Work email |
| `contact.labels.company` | text | Company |
| `contact.labels.role` | text | Role |
| `contact.labels.workflow` | text | First workflow you want to automate |
| `security.meta.title` | text | Security Review |
| `security.meta.description` | text | How Selona approaches security review and controlled finance AI workflows. |
| `security.eyebrow` | text | SECURITY REVIEW |
| `security.heading` | text | Built for controlled finance AI workflows. |
| `security.sub` | text | A practical overview of how ThinkAIWork supports reviewable inputs, traceable outputs, and… |
| `security.sections.0.heading` | text | Controlled deployments |
| `security.sections.0.body` | text | ThinkAIWork is introduced through scoped pilots and deployment reviews so teams can confir… |
| `security.sections.1.heading` | text | Workspace access and roles |
| `security.sections.1.body` | text | Workspaces are structured around the teams and workflows using them. Role and access requi… |
| `security.sections.2.heading` | text | Source-linked outputs |
| `security.sections.2.body` | text | Outputs are designed to reference the files, context, and workflow inputs used to produce … |
| `security.sections.3.heading` | text | Context versioning |
| `security.sections.3.body` | text | Finance context changes over time. ThinkAIWork is designed around versioned context so tea… |
| `security.sections.4.heading` | text | Approval-ready workflows |
| `security.sections.4.body` | text | Recurring workflows can be shaped around review steps, exceptions, evidence, and approval … |
| `security.sections.5.heading` | text | Model flexibility |
| `security.sections.5.body` | text | ThinkAIWork is model-agnostic. Teams can review approved model options and routing prefere… |
| `security.sections.6.heading` | text | Security review materials available for pilots |
| `security.sections.6.body` | text | Security and deployment materials are available during qualified pilot discussions, includ… |
| `security.sections.7.heading` | text | Enterprise review before deployment |
| `security.sections.7.body` | text | Enterprise teams can complete security, legal, and procurement review before production de… |
| `security.contactLine` | text | For security review materials, contact |
| `privacy.meta.title` | text | Privacy Policy |
| `privacy.meta.description` | text | How Selona handles website, enquiry, and pilot information. |
| `privacy.eyebrow` | text | PRIVACY |
| `privacy.heading` | text | Privacy Policy |
| `privacy.updated` | text | Last updated: July 5, 2026 |
| `privacy.intro` | text | This policy explains how Selona handles information collected through this website, walkth… |
| `privacy.sections.0.heading` | text | Information we collect |
| `privacy.sections.0.paragraphs.0` | text | We collect information you choose to provide when you contact Selona, request a walkthroug… |
| `privacy.sections.0.list.0` | text | Contact details such as name, work email, company, role, and message content. |
| `privacy.sections.0.list.1` | text | Workflow information you provide, such as the first finance workflow you want to automate. |
| `privacy.sections.0.list.2` | text | Calendar booking details if you use the meeting link on this website. |
| `privacy.sections.0.list.3` | text | Technical information normally sent by a browser, such as IP address, device type, browser… |
| `privacy.sections.1.heading` | text | Contact forms and email |
| `privacy.sections.1.paragraphs.0` | text | The contact form on this website opens a prefilled email to Selona rather than submitting … |
| `privacy.sections.1.paragraphs.1` | text | We use contact information to respond to enquiries, arrange walkthroughs, assess pilot fit… |
| `privacy.sections.2.heading` | text | Calendar booking provider |
| `privacy.sections.2.paragraphs.0` | text | This website links to a HubSpot Meetings booking page. If you use that link, HubSpot may p… |
| `privacy.sections.3.heading` | text | Website analytics and cookies |
| `privacy.sections.3.paragraphs.0` | text | At the time this policy was last updated, this website does not include a dedicated analyt… |
| `privacy.sections.3.paragraphs.1` | text | Hosting, browser, and security infrastructure may still generate basic server logs or tech… |
| `privacy.sections.4.heading` | text | Product and pilot data |
| `privacy.sections.4.paragraphs.0` | text | During a ThinkAIWork pilot, teams may choose to provide source files, company context, wor… |
| `privacy.sections.4.paragraphs.1` | text | Do not send confidential product or pilot materials through the website contact form unles… |
| `privacy.sections.5.heading` | text | How we use information |
| `privacy.sections.5.paragraphs.0` | text | We use information to respond to enquiries, arrange walkthroughs, evaluate pilot fit, prov… |
| `privacy.sections.5.paragraphs.1` | text | We do not sell personal information. We may share information with service providers who h… |
| `privacy.sections.6.heading` | text | Retention and deletion |
| `privacy.sections.6.paragraphs.0` | text | We keep enquiry and business-contact information for as long as needed to manage the relat… |
| `privacy.sections.6.paragraphs.1` | text | You can ask us to update, export, or delete personal information by contacting info@selona… |
| `privacy.sections.7.heading` | text | UK and EU privacy rights |
| `privacy.sections.7.paragraphs.0` | text | Where UK GDPR or EU GDPR applies, you may have rights to access, correct, delete, restrict… |
| `privacy.sections.7.paragraphs.1` | text | Where we rely on legitimate interests, those interests include responding to business enqu… |
| `privacy.sections.8.heading` | text | Security |
| `privacy.sections.8.paragraphs.0` | text | We take reasonable steps to protect information we handle. No website, email flow, or inte… |
| `privacy.sections.8.paragraphs.1` | text | Security review materials for ThinkAIWork pilots or deployments are available during quali… |
| `privacy.sections.9.heading` | text | Changes to this policy |
| `privacy.sections.9.paragraphs.0` | text | We may update this policy as Selona, ThinkAIWork, or our website operations evolve. The up… |
| `privacy.sections.10.heading` | text | Contact |
| `privacy.sections.10.paragraphs.0` | text | For privacy questions, data requests, or deletion requests, contact info@selona.ai. |
| `applyNow.meta.title` | text | Apply Now |
| `applyNow.meta.description` | text | Join the engineering team behind ThinkAIWork. |
| `applyNow.eyebrow` | text | APPLY NOW |
| `applyNow.heading` | text | Apply |
| `applyNow.sub` | text | Join our team and build the future of context-driven AI automation. |
| `applyNow.roles.0.eyebrow` | text | Open role: Remote (UK) |
| `applyNow.roles.0.role` | text | AI Developer Intern |
| `applyNow.roles.0.details` | text | Location: Remote (UK). Duration: 3-6 months (with potential for extension or full-time off… |
| `applyNow.roles.1.eyebrow` | text | Open role: Remote (India) |
| `applyNow.roles.1.role` | text | AI Developer Intern |
| `applyNow.roles.1.details` | text | Location: Remote (India). Duration: 3-6 months (with potential for extension or full-time … |
| `applyNow.enquiriesLabel` | text | For role enquiries: |
| `applyNow.bookingText` | text | Book a quick introductory conversation with our talent coordinator. |
| `applyNow.bookingLink` | text | Book a call |
| `applyNow.labels.name` | text | Full Name |
| `applyNow.labels.email` | text | Email Address |
| `applyNow.labels.role` | text | Job Role |
| `applyNow.labels.resume` | text | Link to your Resume |
| `notFound.code` | text | 404 |
| `notFound.heading` | text | This page seems to have automated itself away. |
| `notFound.body` | text | The page you are looking for does not exist or has moved. |
| `notFound.home` | text | Back to home |
| `notFound.contact` | text | Contact Us |

Totals: {"text":400,"image":13,"setting (not edited)":36,"video":2}

Not moved (code, not content): the contact form recipient address (moving it into editable content would let an editor redirect enquiries), link targets, design flags (tone, highlighted), and decorative glyphs (✓, ·, +, quote marks, step numbers computed from position).

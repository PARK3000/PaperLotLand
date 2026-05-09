// Main analytics exports

// GTM dataLayer
export { pushToDataLayer, isDataLayerAvailable } from './gtag'

// Events
export { ANALYTICS_EVENTS, SERVER_EVENTS } from './events'
export type {
  AnalyticsEventName,
  PageType,
  FormViewedProps,
  FormStartedProps,
  FormFieldCompletedProps,
  FormValidationErrorProps,
  FormSubmittedProps,
  FormErrorProps,
  CtaClickedProps,
  CtaViewedProps,
  PhoneClickedProps,
  SmsClickedProps,
  PopupEventProps,
  PartialLeadStreamProps,
  LeadSubmissionServerProps,
} from './events'

// Page-type segmentation
export { getPageType } from './page-type'

// Hooks
export { useTrackEvent } from './hooks'

// Form Analytics
export { useFormAnalytics } from './form-analytics'

// Gravity Forms Compatibility (GTM backwards compat)
export {
  getGravityFormId,
  emulateGravityFormSubmit,
  emulateGravityFormConfirmation,
  emulateGravityFormStep,
} from './gravity-forms-compat'

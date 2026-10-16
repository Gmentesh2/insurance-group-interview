/** Expected API failures are translated here, never rendered as raw server messages. */
export const accountErrorMessages = {
  en: {
    error_REQUEST_TIMEOUT: 'This request took too long. Check the latest status before retrying.',
    error_INVALID_RESPONSE: 'The result could not be confirmed. Check its latest status.',
    error_GUEST_LINK_INVALID: 'This access request could not be confirmed. Check your session and try again.',
    error_GUEST_ALREADY_SAVED: 'These purchases already have verified access. Sign in to that account.',
    acceptUpdatedPrice: 'Accept updated price',
    quotedAge: "Quoted age at departure: {age}",
    error_VALIDATION: "Please check the information you entered.",
    error_AUTH_REQUIRED: "Please sign in again to continue.",
    error_AUTH_SEND_FAILED:
      "We could not send your code. Check your email and try again.",
    error_INVALID_CODE:
      "That code was not accepted. Check it or request a new code.",
    error_SIGN_OUT_FAILED: "We could not sign you out. Please try again.",
    error_QUOTE_EXPIRED:
      "Your quote has expired. Return to the offers and get a fresh quote.",
    error_PRICE_CHANGED:
      "The price has changed. Please review your offer again.",
    error_ORDER_LOCKED: "This order can no longer be edited.",
    error_TRAVELER_COUNT:
      "Enter details for every traveler included in the quote.",
    error_AGE_MISMATCH:
      "A date of birth does not match the age quoted at departure. Check the age shown for each traveler.",
    error_DETAILS_REQUIRED:
      "Save the traveler details before continuing to payment.",
    error_PAYMENT_REQUIRED: "Complete payment before checking policy issuance.",
    error_CLAIM_LOCKED:
      "This claim has been submitted and can no longer be edited.",
    error_POLICY_LOCKED: "A claim cannot be moved to another policy.",
    error_CLAIM_CHANGED:
      "Your claim was updated elsewhere. Refresh to see the latest version.",
    error_CLAIM_INCOMPLETE:
      "Add an incident date, a requested amount greater than €0, and a description of at least 20 characters.",
    error_INCIDENT_DATE: "The incident date cannot be in the future.",
    error_FILE_LIMIT: "This claim has reached its document limit.",
    error_INVALID_IDEMPOTENCY_KEY: "This request could not be identified. Refresh and try again.",
    error_CLAIM_CREATE_CONFLICT: "This request was already used for a different claim. Open your claims to review it.",
    error_INVALID_UPLOAD_ATTEMPT: "This upload could not be identified. Select the document again.",
    error_UPLOAD_ATTEMPT_CONFLICT: "This upload belongs to a different document. Select the original file to retry.",
    error_UPLOAD_ATTEMPT_EXPIRED: "This upload attempt has expired. Select the document again to start a new upload.",
    error_UPLOAD_FAILED: "The document could not be stored. Check its status, then retry the upload.",
    error_FILE_TOO_LARGE: "Choose a document no larger than 10 MB.",
    error_INVALID_FILE: "Choose a valid PDF, JPG or PNG file.",
    error_INVALID_TRANSITION:
      "That status change is not available at this stage.",
    error_INVALID_ORIGIN: "Refresh this page and try again.",
    error_TOO_LARGE: "This request is too large. Try a smaller file.",
    error_INVALID_JSON: "We could not process that request. Please try again.",
    error_SERVER_ERROR:
      "The service is temporarily unavailable. Please try again.",
    error_REQUEST_FAILED:
      "We could not complete that request. Please try again.",
  },
  de: {
    error_REQUEST_TIMEOUT: 'Die Anfrage dauerte zu lange. Prüfen Sie vor einem neuen Versuch den aktuellen Status.',
    error_INVALID_RESPONSE: 'Das Ergebnis konnte nicht bestätigt werden. Prüfen Sie den aktuellen Status.',
    error_GUEST_LINK_INVALID: 'Diese Zugriffsanfrage konnte nicht bestätigt werden. Prüfen Sie Ihre Sitzung und versuchen Sie es erneut.',
    error_GUEST_ALREADY_SAVED: 'Diese Käufe sind bereits gesichert. Melden Sie sich im bestätigten Konto an.',
    acceptUpdatedPrice: 'Neuen Preis bestätigen',
    quotedAge: "Alter bei Abreise laut Angebot: {age}",
    error_VALIDATION: "Bitte prüfen Sie Ihre Angaben.",
    error_AUTH_REQUIRED: "Bitte melden Sie sich erneut an.",
    error_AUTH_SEND_FAILED:
      "Der Code konnte nicht gesendet werden. Prüfen Sie Ihre E-Mail-Adresse und versuchen Sie es erneut.",
    error_INVALID_CODE:
      "Der Code wurde nicht akzeptiert. Prüfen Sie ihn oder fordern Sie einen neuen an.",
    error_SIGN_OUT_FAILED: "Abmeldung fehlgeschlagen. Bitte erneut versuchen.",
    error_QUOTE_EXPIRED:
      "Ihr Angebot ist abgelaufen. Kehren Sie zu den Angeboten zurück und fordern Sie ein neues an.",
    error_PRICE_CHANGED:
      "Der Preis hat sich geändert. Prüfen Sie Ihr Angebot erneut.",
    error_ORDER_LOCKED: "Diese Bestellung kann nicht mehr bearbeitet werden.",
    error_TRAVELER_COUNT:
      "Ergänzen Sie die Angaben für alle Reisenden des Angebots.",
    error_AGE_MISMATCH:
      "Ein Geburtsdatum stimmt nicht mit dem Alter bei Abreise überein. Prüfen Sie das angezeigte Alter jeder Person.",
    error_DETAILS_REQUIRED:
      "Speichern Sie die Angaben zu den Reisenden vor der Zahlung.",
    error_PAYMENT_REQUIRED:
      "Schließen Sie die Zahlung ab, bevor Sie die Policenausstellung prüfen.",
    error_CLAIM_LOCKED:
      "Diese Schadenmeldung wurde bereits eingereicht und kann nicht mehr bearbeitet werden.",
    error_POLICY_LOCKED:
      "Eine Schadenmeldung kann keiner anderen Police zugeordnet werden.",
    error_CLAIM_CHANGED:
      "Ihre Schadenmeldung wurde an anderer Stelle aktualisiert. Laden Sie die aktuelle Version neu.",
    error_CLAIM_INCOMPLETE:
      "Ergänzen Sie das Vorfallsdatum, einen beantragten Betrag über 0 € und eine Beschreibung mit mindestens 20 Zeichen.",
    error_INCIDENT_DATE: "Das Vorfallsdatum darf nicht in der Zukunft liegen.",
    error_FILE_LIMIT: "Die maximale Anzahl an Dokumenten wurde erreicht.",
    error_INVALID_IDEMPOTENCY_KEY: "Die Anfrage konnte nicht zugeordnet werden. Laden Sie die Seite neu und versuchen Sie es erneut.",
    error_CLAIM_CREATE_CONFLICT: "Diese Anfrage wurde bereits für eine andere Schadenmeldung verwendet. Prüfen Sie Ihre Schadenmeldungen.",
    error_INVALID_UPLOAD_ATTEMPT: "Der Upload konnte nicht zugeordnet werden. Wählen Sie das Dokument erneut aus.",
    error_UPLOAD_ATTEMPT_CONFLICT: "Dieser Upload gehört zu einem anderen Dokument. Wählen Sie für einen neuen Versuch die ursprüngliche Datei.",
    error_UPLOAD_ATTEMPT_EXPIRED: "Dieser Uploadversuch ist abgelaufen. Wählen Sie das Dokument erneut aus.",
    error_UPLOAD_FAILED: "Das Dokument konnte nicht gespeichert werden. Prüfen Sie den Status und versuchen Sie es erneut.",
    error_FILE_TOO_LARGE: "Wählen Sie ein Dokument mit maximal 10 MB.",
    error_INVALID_FILE: "Wählen Sie eine gültige PDF-, JPG- oder PNG-Datei.",
    error_INVALID_TRANSITION: "Diese Statusänderung ist aktuell nicht möglich.",
    error_INVALID_ORIGIN:
      "Laden Sie die Seite neu und versuchen Sie es erneut.",
    error_TOO_LARGE: "Die Anfrage ist zu groß. Wählen Sie eine kleinere Datei.",
    error_INVALID_JSON:
      "Die Anfrage konnte nicht verarbeitet werden. Bitte erneut versuchen.",
    error_SERVER_ERROR:
      "Der Dienst ist vorübergehend nicht verfügbar. Bitte erneut versuchen.",
    error_REQUEST_FAILED:
      "Die Anfrage konnte nicht abgeschlossen werden. Bitte erneut versuchen.",
  },
  ru: {
    error_REQUEST_TIMEOUT: 'Запрос занял слишком много времени. Проверьте текущий статус перед повторной попыткой.',
    error_INVALID_RESPONSE: 'Не удалось подтвердить результат. Проверьте текущий статус.',
    error_GUEST_LINK_INVALID: 'Не удалось подтвердить доступ. Проверьте сессию и повторите попытку.',
    error_GUEST_ALREADY_SAVED: 'Доступ к этим покупкам уже сохранён. Войдите в подтверждённый аккаунт.',
    acceptUpdatedPrice: 'Принять новую цену',
    quotedAge: "Возраст на дату выезда в расчёте: {age}",
    error_VALIDATION: "Проверьте введённые данные.",
    error_AUTH_REQUIRED: "Войдите снова, чтобы продолжить.",
    error_AUTH_SEND_FAILED:
      "Не удалось отправить код. Проверьте email и попробуйте снова.",
    error_INVALID_CODE: "Код не принят. Проверьте его или запросите новый.",
    error_SIGN_OUT_FAILED: "Не удалось выйти. Попробуйте ещё раз.",
    error_QUOTE_EXPIRED:
      "Срок предложения истёк. Вернитесь к предложениям и получите новый расчёт.",
    error_PRICE_CHANGED: "Цена изменилась. Проверьте предложение ещё раз.",
    error_ORDER_LOCKED: "Этот заказ больше нельзя изменить.",
    error_TRAVELER_COUNT: "Укажите данные всех путешественников из расчёта.",
    error_AGE_MISMATCH:
      "Дата рождения не соответствует возрасту на дату выезда. Проверьте указанный возраст каждого путешественника.",
    error_DETAILS_REQUIRED: "Сохраните данные путешественников перед оплатой.",
    error_PAYMENT_REQUIRED: "Завершите оплату перед проверкой выпуска полиса.",
    error_CLAIM_LOCKED: "Заявление уже отправлено, его нельзя изменить.",
    error_POLICY_LOCKED: "Нельзя перенести заявление на другой полис.",
    error_CLAIM_CHANGED:
      "Заявление было изменено в другом месте. Обновите страницу.",
    error_CLAIM_INCOMPLETE:
      "Укажите дату происшествия, запрошенную сумму больше 0 € и описание минимум из 20 символов.",
    error_INCIDENT_DATE: "Дата происшествия не может быть в будущем.",
    error_FILE_LIMIT: "Достигнуто максимальное количество документов.",
    error_INVALID_IDEMPOTENCY_KEY: "Не удалось определить запрос. Обновите страницу и попробуйте снова.",
    error_CLAIM_CREATE_CONFLICT: "Этот запрос уже использован для другого заявления. Проверьте список заявлений.",
    error_INVALID_UPLOAD_ATTEMPT: "Не удалось определить загрузку. Выберите документ повторно.",
    error_UPLOAD_ATTEMPT_CONFLICT: "Эта загрузка связана с другим документом. Для повтора выберите исходный файл.",
    error_UPLOAD_ATTEMPT_EXPIRED: "Срок попытки загрузки истёк. Выберите документ заново.",
    error_UPLOAD_FAILED: "Не удалось сохранить документ. Проверьте статус и повторите загрузку.",
    error_FILE_TOO_LARGE: "Выберите документ размером не более 10 МБ.",
    error_INVALID_FILE: "Выберите корректный файл PDF, JPG или PNG.",
    error_INVALID_TRANSITION:
      "На этом этапе такое изменение статуса недоступно.",
    error_INVALID_ORIGIN: "Обновите страницу и попробуйте снова.",
    error_TOO_LARGE: "Запрос слишком большой. Выберите файл меньшего размера.",
    error_INVALID_JSON: "Не удалось обработать запрос. Попробуйте снова.",
    error_SERVER_ERROR: "Сервис временно недоступен. Попробуйте снова.",
    error_REQUEST_FAILED: "Не удалось выполнить запрос. Попробуйте снова.",
  },
} as const;

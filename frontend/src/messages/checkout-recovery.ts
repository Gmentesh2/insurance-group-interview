export const checkoutRecoveryMessages = {
  en: {
    previousTotal: "Previous quote total · expired",
    expiredLabel: "Quote expired",
    expiredTitle: "Let’s refresh your options.",
    expiredDescription:
      "Your trip details are saved. Get current prices, compare the new offers and choose your cover again.",
    expiredUnpaid: "No payment has been taken for this order.",
    checkingTitle: "Checking your order",
    checkingDescription:
      "We’re confirming your payment status before refreshing the offers.",
    checkingFailed:
      "We couldn’t confirm your order’s status. Try again before requesting new offers.",
    checkAgain: "Check order again",
    refreshQuotes: "Get fresh quotes",
    editTrip: "Edit trip details",
    firstNameInvalid: "Enter a first name of up to 80 characters.",
    lastNameInvalid: "Enter a last name of up to 80 characters.",
    birthDateInvalid: "Enter a valid date of birth that is not in the future.",
    birthDateAgeMismatch:
      "This traveler must be {age} years old on the departure date. Check their date of birth.",
  },
  de: {
    previousTotal: "Bisheriger Gesamtpreis · abgelaufen",
    expiredLabel: "Angebot abgelaufen",
    expiredTitle: "Holen Sie aktuelle Angebote ein.",
    expiredDescription:
      "Ihre Reisedaten sind gespeichert. Vergleichen Sie die neuen Angebote mit aktuellen Preisen und wählen Sie Ihren Schutz erneut aus.",
    expiredUnpaid: "Für diese Bestellung wurde keine Zahlung eingezogen.",
    checkingTitle: "Ihre Bestellung wird geprüft",
    checkingDescription:
      "Wir bestätigen Ihren Zahlungsstatus, bevor wir neue Angebote anfordern.",
    checkingFailed:
      "Der Bestellstatus konnte nicht bestätigt werden. Versuchen Sie es erneut, bevor Sie neue Angebote anfordern.",
    checkAgain: "Bestellung erneut prüfen",
    refreshQuotes: "Neue Angebote anfordern",
    editTrip: "Reisedaten bearbeiten",
    firstNameInvalid: "Geben Sie einen Vornamen mit höchstens 80 Zeichen ein.",
    lastNameInvalid: "Geben Sie einen Nachnamen mit höchstens 80 Zeichen ein.",
    birthDateInvalid:
      "Geben Sie ein gültiges Geburtsdatum ein, das nicht in der Zukunft liegt.",
    birthDateAgeMismatch:
      "Diese Person muss bei der Abreise {age} Jahre alt sein. Prüfen Sie das Geburtsdatum.",
  },
  ru: {
    previousTotal: "Прежняя общая цена · срок истёк",
    expiredLabel: "Срок предложения истёк",
    expiredTitle: "Обновим предложения для вашей поездки.",
    expiredDescription:
      "Данные поездки сохранены. Получите актуальные цены, сравните новые предложения и снова выберите страховку.",
    expiredUnpaid: "Оплата по этому заказу не списывалась.",
    checkingTitle: "Проверяем ваш заказ",
    checkingDescription:
      "Подтверждаем статус оплаты перед обновлением предложений.",
    checkingFailed:
      "Не удалось подтвердить статус заказа. Повторите проверку перед запросом новых предложений.",
    checkAgain: "Проверить заказ снова",
    refreshQuotes: "Получить новые предложения",
    editTrip: "Изменить данные поездки",
    firstNameInvalid: "Введите имя длиной не более 80 символов.",
    lastNameInvalid: "Введите фамилию длиной не более 80 символов.",
    birthDateInvalid:
      "Введите корректную дату рождения, которая не находится в будущем.",
    birthDateAgeMismatch:
      "На дату выезда этому путешественнику должно быть {age} лет. Проверьте дату рождения.",
  },
} as const;

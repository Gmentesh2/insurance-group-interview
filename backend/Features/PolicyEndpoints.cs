using InsuranceGroup.Api.Domain;
using InsuranceGroup.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;
using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;

namespace InsuranceGroup.Api.Features;

public sealed class SourceSansFontResolver : IFontResolver
{
    public byte[] GetFont(string faceName) => File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Assets", "SourceSans3-Regular.ttf"));
    public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic) => new("SourceSans3");
}
public static class PolicyDocument
{
    public static byte[] Create(PolicyDto policy, string locale)
    {
        var ru = locale == "ru"; var de = locale == "de";
        string L(string en, string german, string russian) => ru ? russian : de ? german : en;
        using var document = new PdfDocument();
        document.Info.Title = "Insurance Group — DEMO " + policy.Number;
        var font = new XFont("SourceSans3", 11);
        var title = new XFont("SourceSans3", 22);
        XGraphics? graphics = null;
        double y = 0;
        void Page()
        {
            graphics?.Dispose();
            var page = document.AddPage(); page.Size = PdfSharp.PageSize.A4;
            graphics = XGraphics.FromPdfPage(page);
            graphics.DrawString("INSURANCE GROUP", font, XBrushes.DarkBlue, 48, 40);
            graphics.DrawString("DEMO — NOT VALID INSURANCE", font, XBrushes.DarkRed, 48, page.Height.Point - 35);
            y = 80;
        }
        void Paragraph(string text, bool heading = false)
        {
            var usedFont = heading ? title : font;
            var line = "";
            foreach (var character in text)
            {
                if (character == '\n' || line.Length > 0 && graphics!.MeasureString(line + character, usedFont).Width > 495)
                {
                    if (y > 760) Page();
                    graphics!.DrawString(line, usedFont, XBrushes.Black, 48, y); y += heading ? 30 : 16; line = "";
                    if (character == '\n') continue;
                }
                line += char.IsControl(character) ? ' ' : character;
            }
            if (line.Length > 0) { if (y > 760) Page(); graphics!.DrawString(line, usedFont, XBrushes.Black, 48, y); y += heading ? 30 : 16; }
            y += 8;
        }
        Page();
        Paragraph(L("Demonstration travel certificate", "Muster-Reiseversicherungsnachweis", "Демонстрационный туристический сертификат"), true);
        Paragraph("DEMO — NOT VALID INSURANCE", true);
        Paragraph(L("This document is a software demonstration. No real insurance coverage or payment exists. Do not use it for travel, visa or medical treatment.", "Dieses Dokument ist eine Software-Demonstration. Es besteht kein echter Versicherungsschutz und keine echte Zahlung. Nicht für Reisen, Visa oder Behandlungen verwenden.", "Это демонстрация программного обеспечения. Реальное страховое покрытие и оплата отсутствуют. Не используйте документ для поездок, виз или лечения."));
        Paragraph(L("Reference", "Referenz", "Номер") + ": " + policy.Number);
        Paragraph(L("Demonstration provider / plan", "Demo-Anbieter / Tarif", "Демонстрационный страховщик / план") + $": {policy.Quote.Provider} / {policy.Quote.Plan}");
        Paragraph(L("Destinations", "Reiseziele", "Страны назначения") + ": " + string.Join(", ", policy.Trip.DestinationCountries));
        Paragraph(L("Residence", "Wohnsitz", "Страна проживания") + ": " + policy.Trip.ResidenceCountry);
        Paragraph(L("Trip dates", "Reisedaten", "Даты поездки") + $": {policy.Trip.StartDate} — {policy.Trip.EndDate}");
        Paragraph(L("Total", "Gesamtbetrag", "Итого") + $": EUR {policy.Quote.TotalCents / 100m:F2}");
        Paragraph(L("Travelers", "Reisende", "Путешественники"), true);
        foreach (var person in policy.Travelers) Paragraph($"{person.FirstName} {person.LastName} — {person.DateOfBirth}");
        Paragraph(L("Benefits from the accepted quote", "Leistungen des angenommenen Angebots", "Покрытие из принятого предложения"), true);
        foreach (var benefit in policy.Quote.Coverage)
        {
            var name = benefit.Key switch
            {
                "medical" => L("Medical", "Medizin", "Медицинские расходы"),
                "cancellation" => L("Cancellation", "Reiserücktritt", "Отмена поездки"),
                "baggage" => L("Baggage", "Gepäck", "Багаж"),
                "delay" => L("Delay", "Verspätung", "Задержка"),
                _ => L("Assistance", "Assistance", "Помощь")
            };
            var status = benefit.Status switch
            {
                "covered" => L("covered", "versichert", "включено"),
                "conditional" => L("conditional", "bedingt", "с условиями"),
                "excluded" => L("excluded", "ausgeschlossen", "исключено"),
                _ => L("not specified", "nicht angegeben", "не указано")
            };
            var scope = benefit.Scope == "per_person" ? L("per person", "pro Person", "на человека") : L("per trip", "pro Reise", "на поездку");
            var limit = benefit.LimitCents.HasValue ? $"EUR {benefit.LimitCents / 100m:F2}" : L("no monetary limit specified", "keine Geldgrenze angegeben", "денежный лимит не указан");
            Paragraph($"{name}: {status}; {limit}; {scope}; " + L("deductible", "Selbstbehalt", "франшиза") + $" EUR {benefit.DeductibleCents / 100m:F2}.");
            if (benefit.Condition == "listed_reasons_only") Paragraph(L("Condition: listed reasons only.", "Bedingung: nur aufgeführte Gründe.", "Условие: только перечисленные причины."));
            if (benefit.Condition == "after_six_hours") Paragraph(L("Condition: after six hours.", "Bedingung: nach sechs Stunden.", "Условие: после шести часов."));
        }
        Paragraph(L("Exclusions", "Ausschlüsse", "Исключения"), true);
        foreach (var exclusion in policy.Quote.Exclusions) Paragraph(exclusion switch
        {
            "pre_existing_conditions" => L("Pre-existing conditions", "Vorerkrankungen", "Ранее существовавшие заболевания"),
            "high_risk_sports" => L("High-risk sports", "Risikosportarten", "Спорт повышенного риска"),
            "known_events" => L("Known events", "Bekannte Ereignisse", "Известные события"),
            _ => exclusion
        });
        Paragraph(L("Terms version", "Bedingungsversion", "Версия условий") + ": " + policy.Quote.TermsVersion);
        Paragraph(L("This snapshot is not a contract. A real provider's full terms and confirmed issuance would govern a real product.", "Diese Momentaufnahme ist kein Vertrag. Bei einem echten Produkt gelten die vollständigen Bedingungen und die bestätigte Ausstellung des Versicherers.", "Этот снимок условий не является договором. В реальном продукте применяются полные условия страховщика и подтвержденное оформление."));
        graphics?.Dispose();
        using var output = new MemoryStream(); document.Save(output, false); return output.ToArray();
    }
}
public static class PolicyEndpoints
{
    private static async Task<PolicyEntity> Owned(Guid id, InsuranceDbContext db, CurrentOwner owner)
    {
        var user = await owner.Require();
        return await db.Policies.WithDetails().SingleOrDefaultAsync(x => x.Id == id && x.OwnerId == user.Id) ?? throw Validation.Missing();
    }
    public static void MapPolicies(this RouteGroupBuilder api)
    {
        api.MapGet("/policies", async (InsuranceDbContext db, CurrentOwner owner) =>
        {
            var user = await owner.Require();
            return new { policies = (await db.Policies.Where(x => x.OwnerId == user.Id).OrderByDescending(x => x.CreatedAt).WithDetails().Take(200).ToListAsync()).Select(Projection.Policy) };
        });
        api.MapGet("/policies/{id:guid}", async (Guid id, InsuranceDbContext db, CurrentOwner owner) => Projection.Policy(await Owned(id, db, owner)));
        api.MapGet("/policies/{id:guid}/documents", async (Guid id, string? locale, InsuranceDbContext db, CurrentOwner owner) =>
        {
            locale ??= "en";
            Validation.Require(locale is "en" or "de" or "ru", "Choose en, de or ru.", "locale");
            var policy = Projection.Policy(await Owned(id, db, owner));
            if (policy.DocumentStatus != "ready") throw new ApiException(409, "DOCUMENT_PENDING", "Your document is being prepared. Try again shortly.");
            return Results.File(PolicyDocument.Create(policy, locale), "application/pdf", policy.Number + "-DEMO.pdf");
        });
    }
}

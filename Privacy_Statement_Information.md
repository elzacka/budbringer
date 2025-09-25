# Budbringer - Data Handling and Privacy Information

This document provides comprehensive information for your "Meld av" page and privacy statement regarding how Budbringer handles user data.

## For the "Meld av" Page (https://forvarelset.tazk.no/page/meld-av/)

### When User Successfully Unsubscribes

**Status Message:**
"Du har blitt avmeldt fra Budbringer nyhetsbrev. E-postadressen din er merket som avmeldt og du vil ikke motta flere e-poster fra oss."

### Data Storage Locations and Handling

When a user unsubscribes, their data is handled across these systems:

#### 1. Budbringer Database (Supabase)
- **Purpose**: Store email address and subscription status for newsletter delivery
- **Data Types**: Email address, subscription status, registration date, last email sent date, registration source
- **Status After Unsubscribe**: Marked as unsubscribed - not deleted (retained for compliance and anti-spam purposes)
- **Location**: EU region (GDPR compliant)

#### 2. GitHub Actions Logs
- **Purpose**: Temporary storage during newsletter generation process
- **Data Types**: Email address during processing
- **Status**: Automatically cleared after each newsletter generation
- **Retention**: No persistent storage

#### 3. Cloudflare Workers
- **Purpose**: Email delivery processing
- **Data Types**: Email address during email sending
- **Status**: No persistent storage - processed and cleared immediately
- **Retention**: No data retention

#### 4. MailChannels (Email Service)
- **Purpose**: Email delivery service
- **Data Types**: Email address, delivery status
- **Status**: Subject to MailChannels retention policy
- **Retention**: Typically 30 days according to MailChannels policy

### Privacy Rights and Compliance

#### GDPR Compliance
- Data processing is based on consent (Article 6(1)(a) GDPR)
- Withdrawal of consent processed immediately (Article 7(3))
- All data stored within EU (Supabase EU region)

#### User Rights
- Right to access your personal data
- Right to rectify incorrect data
- Right to request complete deletion of personal data
- Right to data portability

#### Data Retention Policy
- **Active Subscriptions**: Data retained until unsubscribe request
- **Unsubscribed Users**: Email marked as unsubscribed but not deleted for compliance and anti-spam purposes
- **Complete Deletion**: Available upon explicit request

## For Your Privacy Statement

### Complete Privacy Statement Text

**Datainnsamling og -bruk**

Budbringer samler inn og behandler følgende personopplysninger:
- E-postadresse (for nyhetsbrevleveranse)
- Registreringsdato
- Abonnementsstatus
- Siste e-post sendt dato
- Registreringskilde

**Rettslig grunnlag**
Behandling av personopplysninger er basert på samtykke i henhold til GDPR artikkel 6(1)(a).

**Datalagring og -plassering**

Dine personopplysninger lagres i følgende systemer:

1. **Budbringer Database (Supabase)**
   - Formål: Lagre e-postadresse og abonnementsstatus for nyhetsbrevleveranse
   - Datatyper: E-postadresse, abonnementsstatus, registreringsdato, siste e-post sendt dato, registreringskilde
   - Plassering: EU-region (GDPR-kompatibel)

2. **GitHub Actions Logs**
   - Formål: Midlertidig lagring under nyhetsbrevgenereringsprosess
   - Datatyper: E-postadresse under behandling
   - Oppbevaring: Ingen permanent lagring - automatisk slettet etter hver nyhetsbrevgenerering

3. **Cloudflare Workers**
   - Formål: E-postleveringsbehandling
   - Datatyper: E-postadresse under e-postsending
   - Oppbevaring: Ingen permanent lagring - behandlet og slettet umiddelbart

4. **MailChannels (E-posttjeneste)**
   - Formål: E-postleveringstjeneste
   - Datatyper: E-postadresse, leveringsstatus
   - Oppbevaring: I henhold til MailChannels retensjonspolicy (typisk 30 dager)

**Dine rettigheter**
I henhold til GDPR har du følgende rettigheter:
- Rett til innsyn i dine personopplysninger
- Rett til retting av feilaktige opplysninger
- Rett til sletting av personopplysninger
- Rett til dataportabilitet
- Rett til å trekke tilbake samtykke

**Dataoppbevaring**
- **Aktive abonnement**: Data oppbevares til avmeldingsforespørsel
- **Avmeldte brukere**: E-post merket som avmeldt men ikke slettet for compliance og anti-spam formål
- **Fullstendig sletting**: Tilgjengelig ved eksplisitt forespørsel

**Avmelding**
Du kan melde deg av når som helst ved å klikke på "meld av"-lenken i nyhetsbrevet. Tilbaketrekking av samtykke behandles umiddelbart i henhold til GDPR artikkel 7(3).

**Kontakt**
For spørsmål om personvern eller for å utøve dine rettigheter, kontakt oss på [din kontakt-e-post].

## API Endpoints for External Integration

Your website can use these endpoints to get detailed unsubscribe information:

### 1. `/api/unsubscribe-info` (POST)
- **Purpose**: Get comprehensive subscription and data handling information
- **Required**: `email` and `signature` (HMAC verification)
- **Returns**: Detailed data storage locations, privacy notes, GDPR compliance info

### 2. `/api/verify-unsubscribe` (GET)
- **Purpose**: Simple verification that unsubscribe was processed
- **Required**: `email` parameter
- **Returns**: Confirmation message with data removal information

## URL Parameters Handling

When users are redirected to your page, check for these URL parameters:

- `?success=true&email={email}` - Successful unsubscribe
- `?error=configuration` - System configuration error
- `?error=invalid_signature` - Invalid/tampered unsubscribe link
- `?error=processing` - Database/processing error

## Sample JavaScript for Your Website

```javascript
// Parse URL parameters on your meld-av page
const urlParams = new URLSearchParams(window.location.search);
const success = urlParams.get('success');
const error = urlParams.get('error');
const email = urlParams.get('email');

if (success === 'true') {
  // Show success message with the information above
} else if (error) {
  // Handle different error cases
}
```

This comprehensive information ensures full GDPR compliance and transparency about data handling across all systems involved in the Budbringer newsletter service.
# EquaCoach

Webapp educativa responsive (stile iOS-like) per aiutare una ragazza di 13 anni a esercitarsi con le equazioni di primo grado.

## Link

- **Repository GitHub:** https://github.com/giu-a/equacoach
- **Deploy one-click su Render:** [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/giu-a/equacoach)

> Clicca il pulsante sopra → accedi/crea account gratuito su Render → il deploy parte automaticamente dal repo GitHub con `render.yaml`.

---

## Funzionalita richieste coperte

1. Identificazione utente con profilo:
- Registrazione con username e-mail e password
- Personalizzazione nickname e foto profilo
- Verifica identita con codice temporaneo inviato via e-mail

2. Generatore AI di equazioni:
- Pulsante per chiedere una nuova equazione al sistema
- Difficolta selezionabile: facile, media, difficile

3. Soluzione illustrata passo-passo:
- Disponibile solo dopo l'inserimento della risposta
- Mostra i passaggi algebrici principali

4. Motore di verifica:
- Sostituisce il valore inserito in entrambi i membri
- Verifica se i due membri coincidono

5. Ranking e premi:
- Statistiche personali (punti, accuratezza, streak)
- Confronto con media e massimo dei partecipanti
- Badge obiettivo (prima risoluzione, streak, hard mode, ecc.)

6. Lingue:
- Italiano default
- Inglese e spagnolo disponibili da selettore

7. Accessibilita e responsive:
- Struttura semantica
- Contrasti leggibili
- Focus states e aria-live
- UI adattiva mobile/desktop

## Stack

- Backend: Node.js + Express
- Auth: session token in-memory persistito su JSON
- Password: bcryptjs
- E-mail: nodemailer (SMTP configurabile)
- Frontend: HTML/CSS/JS vanilla
- Persistenza: file JSON in data/db.json

## Avvio locale

1. Installa dipendenze:

```bash
npm install
```

2. Configura ambiente:

```bash
cp .env.example .env
```

3. Se vuoi invio e-mail reale, compila SMTP in `.env`.

4. Avvia app:

```bash
npm start
```

5. Apri:

- http://localhost:3000

## Nota invio e-mail

Se SMTP non e configurato, la verifica resta funzionante in modalita sviluppo:
- il codice viene restituito nella risposta API e mostrato a schermo.

## Pubblicazione su GitHub

Nel tuo terminale:

```bash
git init
git add .
git commit -m "feat: EquaCoach webapp completa"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/equacoach.git
git push -u origin main
```

Dopo il push avrai il link GitHub del progetto.

## Deploy online consigliato

- Render o Railway per Node.js
- Imposta variabili ambiente su piattaforma
- URL finale pubblico condivisibile

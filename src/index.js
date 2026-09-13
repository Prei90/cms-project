require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const publicRouter = require("./renderer/publicRouter");

const app = express();

app.use(cors());
app.use(express.json());

// Geüploade bestanden publiek toegankelijk maken, bv. http://localhost:4000/uploads/foto.jpg
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRoutes);

// Publieke, gerenderde site — moet als LAATSTE gemount worden, want /:slug vangt anders alles op
app.use("/", publicRouter);

// Algemene error handler (vangt onverwachte fouten op, i.p.v. dat de server crasht)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Er ging iets mis op de server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CMS API draait op http://localhost:${PORT}`);
});

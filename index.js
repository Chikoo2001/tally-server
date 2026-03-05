require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/ledger-groups", require("./routes/ledgerGroups"));
app.use("/api/ledgers", require("./routes/ledgers"));
app.use("/api/vouchers", require("./routes/vouchers"));
app.use("/api/stock", require("./routes/stock"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/gst", require("./routes/gst"));

app.get("/api/health", (req, res) => res.json({ status: "OK" }));

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

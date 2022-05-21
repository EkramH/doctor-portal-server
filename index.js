const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5t7fz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctor_portal").collection("services");
    const bookingCollection = client.db("doctor_portal").collection("bookings");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //Practing query... not a proper way to query
    //Available booking
    app.get("/available", async (req, res) => {
      const date = req.query.date || "May 21, 2022";

      //Get all serviec
      const services = await serviceCollection.find().toArray();

      //get booking of that day
      const query = { date: date };
      const booking = await bookingCollection.find(query).toArray();

      //For each service
      services.forEach((service) => {
        //finding booking for that service
        const serviceBooking = booking.filter(
          (book) => book.treatment === service.name
        );

        //Selet slots for that service
        const bookedSlots = serviceBooking.map((book) => book.slot);

        //Select those slots that are not in bookedSlots
        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        service.slots = available;
      });

      res.send(services);
    });

    //Get Booking
    app.get("/booking", async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    //Add Booking
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doctor Portal Sever On!!!!");
});

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`);
});

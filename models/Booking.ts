import mongoose, { Schema, model, models } from 'mongoose';

const BookingSchema = new Schema(
  {
    bookingNo: { type: Number, required: true, unique: true },
    bookingDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    salutation: { type: String, required: true, enum: ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.'] },
    doctorName: { type: String, required: true },
    countryCode: { type: String, required: true },
    mobileNo: { type: String, required: true },
    email: { type: String, required: true },
    hospitalName: { type: String, required: true },
    specialty: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    place: { type: String, required: true },
    location: { type: String, required: true },
  },
  { timestamps: true }
);

export default models.Booking || model('Booking', BookingSchema);
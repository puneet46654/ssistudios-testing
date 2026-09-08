import mongoose, { Schema, Document } from 'mongoose';

export interface IMantramBooking extends Document {
  bookingNo: number;
  bookingDate: string;
  slotTime: string;
  country: string;
  state: string;
  place: string;
  location: string;
  salutation: string;
  doctorName: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  hospitalName: string;
  specialty: string;
  createdAt: Date;
}

const MantramBookingSchema = new Schema<IMantramBooking>({
  bookingNo: { type: Number, required: true, unique: true },
  bookingDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  place: { type: String, required: true },
  location: { type: String, required: true },
  salutation: { type: String, required: true },
  doctorName: { type: String, required: true },
  countryCode: { type: String, required: true },
  mobileNo: { type: String, required: true },
  email: { type: String, required: true },
  hospitalName: { type: String, required: true },
  specialty: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MantramBooking || 
  mongoose.model<IMantramBooking>('MantramBooking', MantramBookingSchema);
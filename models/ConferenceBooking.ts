import mongoose, { Schema, Document } from 'mongoose';

export interface IConferenceBooking extends Document {
  bookingNo: number;
  bookingDate: string;
  slotTime: string;
  country: string;
  state: string;
  place: string;
  location: string;
  salutation: string;
  delegateName: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  hospitalName: string;
  conferenceName: string;
  designation: string;
  createdAt: Date;
}

const ConferenceBookingSchema = new Schema<IConferenceBooking>({
  bookingNo: { type: Number, required: true, unique: true },
  bookingDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  place: { type: String, required: true },
  location: { type: String, required: true },
  salutation: { type: String, required: true },
  delegateName: { type: String, required: true },
  countryCode: { type: String, required: true },
  mobileNo: { type: String, required: true },
  email: { type: String, required: true },
  hospitalName: { type: String, required: true },
  conferenceName: { type: String, required: true },
  designation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ConferenceBooking || 
  mongoose.model<IConferenceBooking>('ConferenceBooking', ConferenceBookingSchema);
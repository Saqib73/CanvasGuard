import mongoose from "mongoose";
const Schema = mongoose.Schema;

const commissionDetailSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  deadline: {
    type: Date,
    required: true,
  },
  artStyle: {
    type: String,
  },
  refrences: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  artistId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  price: {
    type: Number,
  },
  description: {
    type: String,
  },
  shippingDetails: {
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
      required: true,
    },
    postal: {
      type: Number,
      required: true,
    },
  },
  isConfirmed: {
    type: Boolean,
    required: true,
  },
});

export const CommissionDetail =
  mongoose.model("CommissionDetail", commissionDetailSchema) ||
  mongoose.model.CommissionDetail;

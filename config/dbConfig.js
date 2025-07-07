import { connect } from "mongoose";

const getDBConnection = () => {
  connect(process.env.MONGODB_URI)
    .then(() => console.log("DB connected"))
    .catch((err) => {
      console.log(err);
    });
};

export default getDBConnection;

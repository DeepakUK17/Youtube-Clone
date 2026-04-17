import mongoose from "mongoose";

mongoose.connect("mongodb+srv://yourtube_user:Deepak%40sai1@cluster0.e9isubi.mongodb.net/youtube-clone?retryWrites=true&w=majority&appName=Cluster0")
.then(async () => {
    const search = "andriya";
    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { channelname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };
    const res = await mongoose.connection.db.collection("users").find(query).toArray();
    console.log(res);
    process.exit(0);
});

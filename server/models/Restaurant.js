import mongoose from 'mongoose'

const gradeSchema = new mongoose.Schema({ date: Date, grade: String, score: Number }, { _id: false })

const restaurantSchema = new mongoose.Schema(
    {
        restaurant_id: String,
        name: String,
        borough: String,
        cuisine: String,
        address: {
            building: String,
            street: String,
            zipcode: String,
            coord: [Number],
        },
        grades: [gradeSchema],
    },
    { collection: 'restaurants' },
)

export default mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema)

# Automotive Service Management System - Queue System

## Overview
The system now includes an intelligent queuing system that allows multiple users to book the same time slot when all advisors are busy. Instead of rejecting bookings, users are automatically added to a queue and assigned advisors as they become available.

## How It Works

### 1. Immediate Booking
- When a user books a time slot and an advisor is available, the booking is confirmed immediately
- The advisor is assigned based on service type specialization and availability

### 2. Queue System
- When all advisors are busy at a requested time slot, the user is automatically added to a queue
- Queue position is determined by first-come-first-served order
- Estimated service time is calculated based on queue position

### 3. Automatic Processing
- When an advisor completes a service or becomes available, the queue is automatically processed
- The next person in the queue is assigned an advisor and their status changes from "Queued" to "Confirmed"
- Queue positions are updated for remaining users

## Key Features

### Queue Management
- **Queue Position**: Each queued booking gets a position number
- **Estimated Service Time**: Calculated based on queue position and service duration
- **Automatic Processing**: Queue is processed when advisors become available
- **Real-time Updates**: Queue information is displayed in real-time

### User Experience
- **Transparent Information**: Users can see their queue position and estimated wait time
- **Flexible Cancellation**: Users can leave the queue anytime before service starts
- **Clear Status**: Queued bookings show "Queued" status with purple color coding
- **Queue Details**: Users can see detailed queue information including wait times

### Management Features
- **Queue Monitoring**: Managers can view queue information for all time slots
- **Manual Processing**: Managers can manually process queues if needed
- **Audit Logging**: All queue operations are logged for tracking

## Technical Implementation

### Database Changes
- Added new fields to Booking model:
  - `queuePosition`: Position in queue
  - `isQueued`: Boolean flag for queued status
  - `queueStartTime`: When booking entered queue
  - `estimatedServiceTime`: Estimated time when service will start
  - `status`: New "Queued" status option

### API Endpoints
- `POST /bookings` - Creates booking or adds to queue
- `GET /bookings/available-slots` - Shows queue information for time slots
- `GET /bookings/queue-info` - Detailed queue information for specific time slot
- `POST /bookings/process-queue` - Manual queue processing (managers only)

### Queue Logic
- Queue is processed automatically when:
  - A service is completed
  - A booking is cancelled
  - An advisor becomes available
- Queue positions are updated in real-time
- Estimated service times are recalculated

## User Interface Updates

### Book Appointment Page
- Shows real-time slot availability
- Displays queue information for busy slots
- Allows booking even when slots are full (joins queue)
- Shows estimated wait times

### Available Slots Page
- Displays queue length for each time slot
- Clickable slots show detailed queue information
- Color-coded status indicators
- Queue join functionality

### My Bookings Page
- Shows queued bookings with purple color coding
- Displays queue position and estimated service time
- Queue-specific actions (Leave Queue)
- Clear status information

## Benefits

1. **No More Rejected Bookings**: Users can always book, even when slots are full
2. **Fair Queue System**: First-come-first-served ensures fairness
3. **Automatic Management**: System handles queue processing automatically
4. **Transparent Information**: Users know exactly where they stand
5. **Flexible Cancellation**: Users can leave queue anytime
6. **Efficient Resource Utilization**: Advisors are assigned as soon as they're available

## Testing the System

1. **Create Multiple Bookings**: Book the same time slot multiple times to test queue
2. **Complete Services**: Mark services as complete to see queue processing
3. **Cancel Bookings**: Cancel queued bookings to test queue updates
4. **Monitor Queue**: Use Available Slots page to see queue information
5. **Manual Processing**: Use manager tools to manually process queues

## Future Enhancements

- **Email Notifications**: Notify users when they move up in queue
- **SMS Alerts**: Send SMS when advisor is assigned
- **Priority Queue**: VIP or loyalty customer priority
- **Dynamic Pricing**: Adjust pricing based on queue length
- **Queue Analytics**: Track queue performance and patterns

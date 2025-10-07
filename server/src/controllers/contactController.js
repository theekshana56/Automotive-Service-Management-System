// ES module import
import Contact from '../models/Contact.js';

// Submit forum question
const submitForumQuestion = async (req, res) => {
  try {
    const { name, email, category, subject, message, priority, phone, userId, timestamp } = req.body;

    // Validate required fields
    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Create new forum question
    const forumQuestion = new Contact({
      name,
      email,
      category,
      subject,
      message,
      priority: priority || 'normal',
      phone: phone || '',
      userId: userId || null,
      timestamp: timestamp || new Date(),
      status: 'pending',
      type: 'forum'
    });

    await forumQuestion.save();

    // TODO: Send notification to HR manager about new forum submission
    // This could be implemented with email notifications or push notifications

    res.status(201).json({
      success: true,
      message: 'Forum question submitted successfully',
      data: {
        id: forumQuestion._id,
        status: forumQuestion.status,
        timestamp: forumQuestion.timestamp
      }
    });

  } catch (error) {
    console.error('Error submitting forum question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit forum question',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all forum questions (for HR/Admin dashboard)
const getForumQuestions = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;

    // Build filter object
    let filter = { type: 'forum' };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get questions with pagination
    const questions = await Contact.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Contact.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: questions.length,
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching forum questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum questions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update forum question status (for HR/Admin)
const updateForumQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = req.user?.id || 'admin';
    }

    const updatedQuestion = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Forum question not found'
      });
    }

    // TODO: Send email notification to user about status update
    // This could be implemented with email service

    res.status(200).json({
      success: true,
      message: 'Forum question updated successfully',
      data: updatedQuestion
    });

  } catch (error) {
    console.error('Error updating forum question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update forum question',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get forum statistics (for HR dashboard)
const getForumStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      { $match: { type: 'forum' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          answered: {
            $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] }
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          categories: {
            $push: '$category'
          }
        }
      }
    ]);

    // Get category breakdown
    const categoryStats = await Contact.aggregate([
      { $match: { type: 'forum' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      answered: 0,
      highPriority: 0,
      categories: []
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: result.total,
          pending: result.pending,
          answered: result.answered,
          highPriority: result.highPriority,
          responseRate: result.total > 0 ? Math.round((result.answered / result.total) * 100) : 0
        },
        categories: categoryStats
      }
    });

  } catch (error) {
    console.error('Error fetching forum stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ES module export
export {
  submitForumQuestion,
  getForumQuestions,
  updateForumQuestionStatus,
  getForumStats
};

import { Op } from "sequelize";
import Task from "../Models/task.js";
import User from "../Models/user.js";
import Trainee from "../Models/trainee.js";
import Attendance from "../Models/attendance.js";
import TaskSubmission from "../Models/taskSubmission.js";
import logger from "../../../helper/logger.js";
import Evaluation from "../Models/evaluation.js";

// GET /api/v1/manager/interns - interns mapped to logged-in manager
export const getMyInterns = async (req, res) => {
  try {
    const trainees = await Trainee.findAll({
      where: { manager_id: req.user.id },
      include: [{ model: User, attributes: ["id", "name", "email", "phone"] }]
    });
    return res.status(200).json({ success: true, data: trainees });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/all-interns - all interns (not filtered by manager)
export const getAllInterns = async (req, res) => {
  try {
    const trainees = await Trainee.findAll({
      include: [{ model: User, attributes: ["id", "name", "email", "phone"] }],
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).json({ success: true, data: trainees });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/stats - dashboard counts
export const getDashboardStats = async (req, res) => {
  try {
    const totalInterns = await Trainee.count({ where: { current_status: "active" } });
    const totalManagers = await User.count({ where: { role_id: 2, is_active: 1 } });
    const totalBuddies = await User.count({ where: { role_id: 3, is_active: 1 } });

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const endingThisMonth = await Trainee.count({
      where: { expected_end_date: { [Op.between]: [start, end] } }
    });

    return res.status(200).json({
      success: true,
      data: { totalInterns, totalManagers, totalBuddies, endingThisMonth }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/manager/interns - create intern record
export const createIntern = async (req, res) => {
  try {
    const { user_id, college_name, course, enrollment_date, expected_end_date, buddy_id } = req.body;

    if (!user_id || !enrollment_date) {
      return res.status(400).json({
        success: false,
        message: "user_id and enrollment_date are required"
      });
    }

    const intern = await Trainee.create({
      user_id,
      college_name,
      course,
      enrollment_date,
      expected_end_date,
      buddy_id: buddy_id || null,
      manager_id: req.user.id,
      current_status: "active"
    });

    return res.status(201).json({ success: true, message: "Intern created", data: intern });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/tasks - tasks created by logged-in manager
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assigned_by: req.user.id },
      include: [{ model: User, as: "assignee", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]]
    });
    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/manager/tasks - create task
export const createTask = async (req, res) => {
  try {
    const { title, description, assigned_to, project_id, start_date, due_date, priority, tech_stack } = req.body;

    if (!title || !assigned_to || !due_date || !project_id) {
      return res.status(400).json({
        success: false,
        message: "title, assigned_to, project_id and due_date are required"
      });
    }

    const trainee = await Trainee.findOne({
      where: { user_id: assigned_to, manager_id: req.user.id }
    });
    if (!trainee) {
      return res.status(403).json({
        success: false,
        message: "You can only assign tasks to your own interns"
      });
    }

    const task = await Task.create({
      title,
      description,
      assigned_to,
      assigned_by: req.user.id,
      project_id,
      start_date: start_date || new Date(),
      due_date,
      priority: priority || "medium",
      tech_stack,
      status: "todo"
    });

    return res.status(201).json({ success: true, message: "Task created", data: task });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/v1/manager/tasks/:id - update task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, assigned_by: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or not yours" });
    }

    const { title, description, due_date, priority, status, completion_percentage, tech_stack } = req.body;
    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      due_date: due_date ?? task.due_date,
      priority: priority ?? task.priority,
      status: status ?? task.status,
      completion_percentage: completion_percentage ?? task.completion_percentage,
      tech_stack: tech_stack ?? task.tech_stack
    });

    return res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE /api/v1/manager/tasks/:id - delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, assigned_by: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or not yours" });
    }

    await task.destroy();
    return res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/tasks/:id/submissions - view intern submissions for a task
export const getTaskSubmissions = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, assigned_by: req.user.id }
    });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found or not yours" });
    }

    const submissions = await TaskSubmission.findAll({
      where: { task_id: task.id },
      include: [{ model: User, as: "intern", attributes: ["id", "name", "email"] }],
      order: [["createdAt", "DESC"]]
    });

    const mapped = submissions.map((submission) => {
      const raw = submission.toJSON();
      return {
        ...raw,
        file_url: raw.file_name
          ? `${req.protocol}://${req.get("host")}/api/uploads/task-submissions/${task.id}/${encodeURIComponent(raw.file_name)}`
          : null
      };
    });

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// POST /api/v1/manager/leaves - assign leave to intern
export const assignLeave = async (req, res) => {
  try {
    const { trainee_user_id, leave_date, remarks } = req.body;
    if (!trainee_user_id || !leave_date) {
      return res.status(400).json({
        success: false,
        message: "trainee_user_id and leave_date are required"
      });
    }

    const trainee = await Trainee.findOne({
      where: { user_id: trainee_user_id, manager_id: req.user.id }
    });
    if (!trainee) {
      return res.status(403).json({ success: false, message: "Intern not under your supervision" });
    }

    const [record, created] = await Attendance.findOrCreate({
      where: { trainee_id: trainee.id, attendance_date: leave_date },
      defaults: { status: "on_leave", remarks: remarks || "Leave approved by manager" }
    });

    if (!created) {
      await record.update({ status: "on_leave", remarks: remarks || "Leave approved by manager" });
    }

    return res.status(200).json({
      success: true,
      message: `Leave assigned for ${leave_date}`,
      data: record
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/leaves/:trainee_user_id - view intern leaves
export const getInternLeaves = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      where: { user_id: req.params.trainee_user_id, manager_id: req.user.id }
    });
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Intern not under your supervision" });
    }

    const leaves = await Attendance.findAll({
      where: { trainee_id: trainee.id, status: "on_leave" },
      order: [["attendance_date", "DESC"]]
    });

    return res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// POST /api/v1/manager/evaluations
export const createEvaluation = async (req, res) => {
  try {
    const { trainee_id, technical_skills, communication, teamwork, problem_solving, punctuality, comments } = req.body
    if (!trainee_id) return res.status(400).json({ success: false, message: "trainee_id is required" })

    const scores = [technical_skills, communication, teamwork, problem_solving, punctuality].map(Number)
    const overall_score = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)

    const evaluation = await Evaluation.create({
      trainee_id,
      evaluator_id:    req.user.id,
      evaluation_date: new Date().toISOString().split('T')[0],
      technical_skills, communication, teamwork,
      problem_solving, punctuality, overall_score, comments,
    })
    return res.status(201).json({ success: true, message: "Evaluation saved", data: evaluation })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}

// GET /api/v1/manager/evaluations/:trainee_id
export const getEvaluations = async (req, res) => {
  try {
    const evals = await Evaluation.findAll({
      where: { trainee_id: req.params.trainee_id },
      order: [['evaluation_date', 'DESC']],
    })
    return res.status(200).json({ success: true, data: evals })
  } catch (error) {
    logger.error(error)
    return res.status(500).json({ success: false, message: "Internal Server Error" })
  }
}
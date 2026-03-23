import { Op } from "sequelize";
import Task, { TASK_STATUSES } from "../Models/task.js";
import User from "../Models/user.js";
import Trainee from "../Models/trainee.js";
import Project from "../Models/project.js";
import Attendance from "../Models/attendance.js";
import TaskSubmission from "../Models/taskSubmission.js";
import logger from "../../../helper/logger.js";
import Evaluation from "../Models/evaluation.js";
import { sendTaskAssignedEmail } from "../../../utils/sendEmail.js";

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

    const assignedToUserId = Number(assigned_to);
    const projectId = Number(project_id);

    if (!Number.isInteger(assignedToUserId) || !Number.isInteger(projectId)) {
      return res.status(400).json({
        success: false,
        message: "assigned_to and project_id must be valid numeric IDs"
      });
    }

    const trainee = await Trainee.findOne({
      where: { user_id: assignedToUserId, manager_id: req.user.id }
    });
    if (!trainee) {
      return res.status(403).json({
        success: false,
        message: "You can only assign tasks to your own interns"
      });
    }

    const project = await Project.findOne({
      where: { id: projectId, manager_id: req.user.id }
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found for this manager. Create a project first or use a valid project ID."
      });
    }

    const task = await Task.create({
      title,
      description,
      assigned_to: assignedToUserId,
      assigned_by: req.user.id,
      project_id: projectId,
      start_date: start_date || new Date().toISOString().split("T")[0],
      due_date,
      priority: priority || "medium",
      tech_stack,
      status: "todo"
    });

    const assignee = await User.findByPk(assignedToUserId, {
      attributes: ["id", "name", "email"]
    });

    await sendTaskAssignedEmail({
      assigneeEmail: assignee?.email,
      assigneeName: assignee?.name,
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      startDate: task.start_date,
      priority: task.priority,
      techStack: task.tech_stack,
      projectName: project.project_name,
      assignerName: req.user.name
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

    if (status !== undefined && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of ${TASK_STATUSES.join(", ")}`
      });
    }

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
// GET /api/v1/manager/leave-requests - see all pending leave requests from interns
export const getPendingLeaveRequests = async (req, res) => {
  try {
    // Get all trainees under this manager
    const trainees = await Trainee.findAll({
      where: { manager_id: req.user.id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    if (!trainees.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const traineeIds = trainees.map(t => t.id);

    const requests = await Attendance.findAll({
      where: {
        trainee_id: traineeIds,
        status: 'pending_leave'
      },
      order: [['attendance_date', 'ASC']],
    });

    // Attach trainee info to each request
    const traineeMap = {};
    trainees.forEach(t => { traineeMap[t.id] = t; });

    const enriched = requests.map(r => ({
      ...r.toJSON(),
      trainee: traineeMap[r.trainee_id] || null,
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/v1/manager/leave-requests/:id - approve or reject a leave request
export const respondToLeaveRequest = async (req, res) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'" });
    }

    const record = await Attendance.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    // Verify this intern belongs to the manager
    const trainee = await Trainee.findOne({
      where: { id: record.trainee_id, manager_id: req.user.id }
    });
    if (!trainee) {
      return res.status(403).json({ success: false, message: "This intern is not under your supervision" });
    }

    const newStatus = action === 'approve' ? 'on_leave' : 'leave_rejected';
    await record.update({
      status: newStatus,
      remarks: remarks || (action === 'approve' ? 'Approved by manager' : 'Rejected by manager'),
    });

    return res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Leave approved' : 'Leave rejected',
      data: record,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// PUT /api/v1/manager/interns/:id/assign-manager
// Allows manager to assign themselves to an intern (or admin can use admin endpoint)
export const assignSelfAsManager = async (req, res) => {
  try {
    const trainee = await Trainee.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    if (!trainee) {
      return res.status(404).json({ success: false, message: 'Intern not found' });
    }
    if (trainee.manager_id && trainee.manager_id !== req.user.id) {
      return res.status(409).json({ success: false, message: 'This intern already has a manager assigned. Please ask an admin to reassign.' });
    }
    await trainee.update({ manager_id: req.user.id });
    return res.status(200).json({ success: true, message: 'You are now assigned as manager for this intern', data: trainee });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
export const getInternWorklog = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      where: { user_id: req.params.trainee_user_id, manager_id: req.user.id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });
    if (!trainee) {
      return res.status(404).json({ success: false, message: 'Intern not under your supervision' });
    }

    // Get all tasks assigned to this intern by this manager
    const tasks = await Task.findAll({
      where: { assigned_to: req.params.trainee_user_id, assigned_by: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    const taskIds = tasks.map(t => t.id);

    // Get all submissions for these tasks
    const submissions = await TaskSubmission.findAll({
      where: { task_id: taskIds },
      include: [{ model: User, as: 'intern', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    // Map submissions back to their tasks
    const taskMap = {};
    tasks.forEach(t => { taskMap[t.id] = { ...t.toJSON(), submissions: [] }; });
    submissions.forEach(s => {
      if (taskMap[s.task_id]) taskMap[s.task_id].submissions.push(s.toJSON());
    });

    return res.status(200).json({
      success: true,
      data: {
        trainee: trainee.toJSON(),
        tasks: Object.values(taskMap),
        totalSubmissions: submissions.length,
      }
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// GET /api/v1/manager/projects - all projects belonging to this manager
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { manager_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ success: true, data: projects });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// POST /api/v1/manager/projects - create a project
export const createProject = async (req, res) => {
  try {
    const { project_name, description, start_date, end_date, status, priority, dept_id } = req.body;
    if (!project_name || !start_date) {
      return res.status(400).json({ success: false, message: 'project_name and start_date are required' });
    }
    const project = await Project.create({
      project_name, description, start_date, end_date,
      status: status || 'planning',
      priority: priority || 'medium',
      dept_id: dept_id || null,
      manager_id: req.user.id,
    });
    return res.status(201).json({ success: true, message: 'Project created', data: project });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// GET /api/v1/manager/project-progress - all interns' task progress per project
export const getProjectProgress = async (req, res) => {
  try {
    // Get all projects for this manager
    const projects = await Project.findAll({
      where: { manager_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    // Get all interns under this manager
    const trainees = await Trainee.findAll({
      where: { manager_id: req.user.id },
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    const internUserIds = trainees.map(t => t.user_id);

    // Get all tasks for this manager's interns
    const tasks = await Task.findAll({
      where: {
        assigned_by: req.user.id,
      },
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    // Build trainee map
    const traineeMap = {};
    trainees.forEach(t => { traineeMap[t.user_id] = t; });

    // Group tasks by project
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.id] = {
        project: p.toJSON(),
        interns: {}
      };
    });

    tasks.forEach(task => {
      const t = task.toJSON();
      const pid = t.project_id;
      if (!projectMap[pid]) {
        // Task belongs to a project not in our list (edge case), skip
        return;
      }
      const uid = t.assigned_to;
      if (!projectMap[pid].interns[uid]) {
        const trainee = traineeMap[uid];
        projectMap[pid].interns[uid] = {
          user: t.assignee,
          trainee: trainee ? trainee.toJSON() : null,
          tasks: [],
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          avgCompletion: 0,
        };
      }
      projectMap[pid].interns[uid].tasks.push(t);
    });

    // Compute stats per intern per project
    Object.values(projectMap).forEach(pm => {
      Object.values(pm.interns).forEach(internData => {
        const ts = internData.tasks;
        internData.totalTasks = ts.length;
        internData.completedTasks = ts.filter(t => t.status === 'completed').length;
        internData.inProgressTasks = ts.filter(t => t.status === 'in_progress').length;
        internData.reviewTasks = ts.filter(t => t.status === 'review').length;
        internData.avgCompletion = ts.length
          ? Math.round(ts.reduce((sum, t) => sum + (t.completion_percentage || 0), 0) / ts.length)
          : 0;
        internData.overallProgress = ts.length
          ? Math.round((internData.completedTasks / ts.length) * 100)
          : 0;
        delete internData.tasks; // keep response lean
      });
      // Convert interns map to array
      pm.interns = Object.values(pm.interns);
    });

    const result = Object.values(projectMap);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// GET /api/v1/manager/recent-submissions
export const getRecentSubmissions = async (req, res) => {
  try {
    const trainees = await Trainee.findAll({ where: { manager_id: req.user.id } });
    const internUserIds = trainees.map(t => t.user_id);

    const submissions = await TaskSubmission.findAll({
      where: { submitted_by: internUserIds },
      include: [
        { 
          model: User, 
          as: "intern", 
          attributes: ["id", "name", "role_id"],
          include: [{
            model: Trainee,
            attributes: ["id", "buddy_id"],
            include: [{ model: User, as: "buddy", attributes: ["name"] }]
          }]
        },
        { model: Task, attributes: ["title"] }
      ],
      order: [["createdAt", "DESC"]],
      limit: 10
    });
    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// GET /api/v1/manager/interns/:trainee_user_id/attendance - fetch daily attendance for an intern
export const getInternAttendance = async (req, res) => {
  try {
    const trainee = await Trainee.findOne({
      where: { user_id: req.params.trainee_user_id, manager_id: req.user.id }
    });
    if (!trainee) {
      return res.status(404).json({ success: false, message: "Intern not under your supervision" });
    }

    const records = await Attendance.findAll({
      where: { trainee_id: trainee.id },
      order: [["attendance_date", "DESC"]],
      limit: 60, // Return last 2 months of attendance
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// DELETE /api/v1/manager/projects/:id - delete a project and its tasks
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, manager_id: req.user.id }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found or not yours" });
    }

    // Delete tasks associated with this project first
    await Task.destroy({ where: { project_id: project.id } });

    await project.destroy();
    return res.status(200).json({ success: true, message: "Project and its tasks deleted successfully" });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

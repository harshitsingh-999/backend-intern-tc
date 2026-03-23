import Task from "../Models/task.js";
import Project from "../Models/project.js";
import Evaluation from "../Models/evaluation.js";
import Attendance from "../Models/attendance.js";
import Trainee from "../Models/trainee.js";
import User from "../Models/user.js";
import logger from "../../../helper/logger.js";

// GET /api/v1/events
export const getEvents = async (req, res) => {
  try {
    const roleId = req.user.role_id;
    const userId = req.user.id;
    let eventList = [];

    // role_id 4 is Intern/Trainee
    if (roleId === 4) {
      const trainee = await Trainee.findOne({ where: { user_id: userId } });
      if (!trainee) return res.json([]);

      // 1. Tasks
      const tasks = await Task.findAll({ where: { assigned_to: userId } });
      tasks.forEach(t => {
        if (t.due_date) {
          eventList.push({
            id: `task-${t.id}`,
            title: `Task Due: ${t.title}`,
            start: t.due_date,
            color: '#ef4444', // red for deadlines
            extendedProps: { type: 'task', status: t.status }
          });
        }
      });
      
      // Also show start dates as "Assigned"
      tasks.forEach(t => {
        if (t.start_date) {
            eventList.push({
                id: `task-s-${t.id}`,
                title: `Task Assigned: ${t.title}`,
                start: t.start_date,
                color: '#3b82f6', // blue for assignment
                extendedProps: { type: 'task', status: t.status }
            });
        }
      });

      // 2. Projects (associated with tasks)
      const projectIds = [...new Set(tasks.map(t => t.project_id).filter(id => id))];
      const projects = await Project.findAll({ where: { id: projectIds } });
      projects.forEach(p => {
        if (p.start_date) {
          eventList.push({
            id: `proj-s-${p.id}`,
            title: `Project Start: ${p.project_name}`,
            start: p.start_date,
            color: '#3b82f6', // blue
            extendedProps: { type: 'project' }
          });
        }
        if (p.end_date) {
          eventList.push({
            id: `proj-e-${p.id}`,
            title: `Project End: ${p.project_name}`,
            start: p.end_date,
            color: '#1d4ed8', // dark blue
            extendedProps: { type: 'project' }
          });
        }
      });

      // 3. Evaluations
      const evals = await Evaluation.findAll({ where: { trainee_id: trainee.id } });
      evals.forEach(e => {
        eventList.push({
          id: `eval-${e.id}`,
          title: "Performance Evaluation",
          start: e.evaluation_date,
          color: '#8b5cf6', // purple
          extendedProps: { type: 'evaluation' }
        });
      });

      // 4. Leaves
      const leaves = await Attendance.findAll({ where: { trainee_id: trainee.id, status: 'on_leave' } });
      leaves.forEach(l => {
        eventList.push({
          id: `leave-${l.id}`,
          title: "On Leave",
          start: l.attendance_date,
          color: '#f59e0b', // amber
          extendedProps: { type: 'leave' }
        });
      });

    } else if (roleId === 1 || roleId === 2) {
      // Manager/Admin
      // 1. Managed Projects
      const projects = await Project.findAll({ where: { manager_id: userId } });
      projects.forEach(p => {
        if (p.start_date) {
          eventList.push({
            id: `m-proj-s-${p.id}`,
            title: `Project Start: ${p.project_name}`,
            start: p.start_date,
            color: '#3b82f6'
          });
        }
        if (p.end_date) {
          eventList.push({
            id: `m-proj-e-${p.id}`,
            title: `Project End: ${p.project_name}`,
            start: p.end_date,
            color: '#1d4ed8'
          });
        }
      });

      // 2. Supervised Interns' data
      const managedTrainees = await Trainee.findAll({
        where: { manager_id: userId },
        include: [{ model: User, attributes: ['id', 'name'] }]
      });
      const traineeUserIds = managedTrainees.map(t => t.user_id);
      const traineeIds = managedTrainees.map(t => t.id);

      // Tasks for managed interns
      const tasks = await Task.findAll({
        where: { assigned_to: traineeUserIds },
        include: [{ model: User, as: 'assignee', attributes: ['name'] }]
      });
      tasks.forEach(t => {
        if (t.due_date) {
          eventList.push({
            id: `m-task-${t.id}`,
            title: `${t.assignee?.name || 'Intern'}: ${t.title} (Due)`,
            start: t.due_date,
            color: '#ef4444'
          });
        }
        if (t.start_date) {
           eventList.push({
             id: `m-task-s-${t.id}`,
             title: `${t.assignee?.name || 'Intern'}: ${t.title} (Assigned)`,
             start: t.start_date,
             color: '#3b82f6'
           });
        }
      });

      // Leaves for managed interns
      const leaves = await Attendance.findAll({
        where: { trainee_id: traineeIds, status: 'on_leave' }
      });
      // Map trainee name
      const traineeMap = {};
      managedTrainees.forEach(t => { traineeMap[t.id] = t.user?.name || 'Intern'; });

      leaves.forEach(l => {
        eventList.push({
          id: `m-leave-${l.id}`,
          title: `${traineeMap[l.trainee_id]} on Leave`,
          start: l.attendance_date,
          color: '#f59e0b'
        });
      });
    }

    res.json(eventList);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
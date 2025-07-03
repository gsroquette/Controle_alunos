import { $ } from './utils.js';

export function showAuth() {
  $('auth-section').classList.remove('hidden');
  $('dashboard-section').classList.add('hidden');
  $('student-section').classList.add('hidden');
  $('totals-section').classList.add('hidden');
}

export function showDashboard() {
  $('auth-section').classList.add('hidden');
  $('dashboard-section').classList.remove('hidden');
  $('student-section').classList.add('hidden');
  $('totals-section').classList.add('hidden');
}

export function showStudentDetail() {
  $('dashboard-section').classList.add('hidden');
  $('student-section').classList.remove('hidden');
  $('totals-section').classList.add('hidden');
}

export function showTotals() {
  $('dashboard-section').classList.add('hidden');
  $('totals-section').classList.remove('hidden');
  $('student-section').classList.add('hidden');
}

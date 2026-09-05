import './App.css'
import { Routes, Route } from 'react-router';
import Visits from './pages/Visits';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import VisitDetail from './pages/VisitDetail';
import Layout from './components/Layout';
import Billing from './pages/Billing';
import Caregivers from './pages/Caregivers';
import CaregiverDetail from './pages/CaregiverDetail';
import NotFound from './pages/NotFound';
import CaregiverVisit from './pages/CaregiverVisit';
import Homepage from './pages/Homepage';
import About from './pages/About';
import MyVisits from './pages/MyVisits';
import MyDocuments from './pages/MyDocuments';


function App() {
  
  return (
      <Routes>
            <Route path="/" element={<Homepage />} />
            <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/visits" element={<Visits />} />
                <Route path="/my-visits" element={<MyVisits />} />
                <Route path="/my-documents" element={<MyDocuments />} />
                <Route path="/visits/:visitId" element={<VisitDetail />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/caregivers" element={<Caregivers />} />
                <Route path="/caregivers/:caregiverId" element={<CaregiverDetail />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:patientId" element={<PatientDetail />} />
                <Route path="/caregiver/visits/:visitId" element={<CaregiverVisit />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
            </Route>
      </Routes>
  )
}

export default App

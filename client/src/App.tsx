import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./contexts/SocketContext";
import { ToastProvider } from "./components/ui/Toast";
import Home from "./pages/Home";
import StudentOnboard from "./pages/StudentOnboard";
import TeacherCreate from "./pages/TeacherCreate";
import StudentWait from "./pages/StudentWait";
import StudentPoll from "./pages/StudentPoll";
import TeacherResults from "./pages/TeacherResults";
import StudentResults from "./pages/StudentResults";
import PollHistory from "./pages/PollHistory";
import Kicked from "./pages/Kicked";

function App() {
  return (
    <SocketProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/student/onboard" element={<StudentOnboard />} />
            <Route path="/teacher/create" element={<TeacherCreate />} />
            <Route path="/student/wait" element={<StudentWait />} />
            <Route path="/student/poll" element={<StudentPoll />} />
            <Route path="/teacher/results" element={<TeacherResults />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/history" element={<PollHistory />} />
            <Route path="/kicked" element={<Kicked />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SocketProvider>
  );
}

export default App;

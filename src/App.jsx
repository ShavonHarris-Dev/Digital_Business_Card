// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './Components.css'
import About from './Components/About'
import Interests from './Components/Interests'
import Footer from './Components/Footer'
import Info from './Components/Info'
import ChatBox from './Components/ChatBox'

function App() {

  return (
    <div className="container">
      <Info />
      <ChatBox />
      <div className="content-grid">
        <About />
        <Interests />
      </div>
      <Footer />
    </div>
  )
}

export default App

import shavon from '../assets/shavon.png'
export default function Info() {
    return (
        <section className="container">
            <img className='profile--image'
           
            src={shavon}
            alt="Shavon Harris"
            />
            <h1 className="name">Shavon Harris</h1>
            <h2 className="info--title">React / Javascript Developer</h2>
            <a className="info--website" href='https://shavonharris-dev.netlify.app/' target="_blank" rel="noopener noreferrer">shavonharris-dev.com</a>
            <a className="info--website" href="https://resume.creddle.io/resume/dm2v090o8ru" target="_blank" rel="noopener noreferrer">View My Resume</a>
            <div className="buttonsContainer">
            <a href="mailto:shavonharris9114@gmail.com">
            <button className="button--email" href="shavonharris9114@gmail.com">Email</button>
             </a>
            <a href="https://www.linkedin.com/in/shavonharris-dev/" target="_blank" rel="noopener noreferrer">
            <button className="button--link">LinkedIn</button>
            </a>
            </div>
        </section>
    )
}

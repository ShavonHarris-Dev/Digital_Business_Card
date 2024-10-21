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
            <a className="info--website" href='https://shavonharris-dev.netlify.app/'>shavonharris-dev.com</a>
            <div className="buttonsContainer">
            <button className="button--email">Email</button>
            <button className="button--link">LinkedIn</button>
            </div>
        </section>
    )
}

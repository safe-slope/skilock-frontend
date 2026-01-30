import AuthorsList from './AuthorsList';

export default function Footer() {
    return (
        <footer className="footer">
            <div>
                © {new Date().getFullYear()} SkiLock
            </div>
            <div className="footer-authors">
                <AuthorsList />
            </div>
        </footer>
    );
}
export const Footer = () => {
  return (
    <footer>
        <p className="text-center text-gray-600 py-10 text-lg">
          &copy; {new Date().getFullYear()} {" | "}
          <a href="#" target="_blank" className="text-indigo-600 font-medium uppercase underline">OUR MOBILE MECHANIC</a>
        </p>
    </footer>
  )
}

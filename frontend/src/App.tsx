import { useState } from "react"
import { Button } from "./components/ui/Button"

function App() {
    const [count, setCount] = useState(0)
  return (
    <>
    <h1 className="text-3xl font-bold underline bg-red-500 text-white p-4">
        Hello world!
    </h1>
    <Button variant="primary" size="md" onClick={() => {setCount(count + 1)}} text="Click me" />
    <div className="text-5xl font-medium bg-primary text-white p-4 mt-4">
        You clicked the button {count} times.</div>
    </>
  )
}

export default App

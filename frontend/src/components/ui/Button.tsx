export interface ButtonProps {
    variant: "primary" | "secondary"
    size: "sm" | "md" | "lg"
    text: string
    startIcon?: any
    endIcon?: any
    onClick: () => void
}


export const Button = (props: ButtonProps) => {
    const baseStyles = "font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 justify-center font-medium"
    
    const variantStyles = {
        primary: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md hover:shadow-lg",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 shadow-sm hover:shadow-md"
    }
    
    const sizeStyles = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-base",
        lg: "px-6 py-3 text-lg"
    }
    
    const combinedClassName = `${baseStyles} ${variantStyles[props.variant]} ${sizeStyles[props.size]}`
    
    return (
        <button 
            className={combinedClassName}
            onClick={props.onClick}
        >
            {props.startIcon && <span className="flex items-center">{props.startIcon}</span>}
            {props.text}
            {props.endIcon && <span className="flex items-center">{props.endIcon}</span>}
        </button>
    )
}



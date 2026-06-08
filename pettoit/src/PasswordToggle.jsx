
function PasswordToggle({ isChecked, onToggle }) {
    return (
        <div className="flex items-center gap-2">
            <input 
                className="border-2 mb-2 p-1.5 h-4 w-4" 
                type="checkbox" 
                id="showPassword" 
                checked={isChecked} 
                onChange={onToggle}
            />
            <label htmlFor="showPassword" className="mb-2 cursor-pointer select-none text-white">
                {isChecked ? "Hide Password" : "Show Password"}
            </label>
        </div>
    );
}

export default PasswordToggle;

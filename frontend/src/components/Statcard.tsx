import type {LucideIcon} from 'lucide-react';

interface StatcardProps {
    title: string;
    amount: string;
    description: string;
    icon: LucideIcon;
}

function Statcard({
    title, 
    amount,
    description,
    icon: Icon,
}: StatcardProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                        {amount}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        {description}
                    </p>
                </div>
                <div className="rounded-lg bg-gray-100 p-3">
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

export default Statcard;
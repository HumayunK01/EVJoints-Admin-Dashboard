import React, { useState } from "react";
import Modal from "@/components/ui/modal";

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "approve" | "reject";
    onConfirm: (reason?: string) => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
    isOpen,
    onClose,
    type,
    onConfirm,
}) => {
    const [reason, setReason] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === "reject" && !reason.trim()) {
            alert("Please provide a rejection reason.");
            return;
        }
        onConfirm(type === "reject" ? reason : undefined);
        onClose();
        setReason(""); // Reset reason
    };

    const isBijection = type === "reject";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === "approve" ? "Approve Submission" : "Reject Submission"}
        >
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    {type === "approve" ? (
                        <p className="text-black dark:text-white">
                            Are you sure you want to approve this station submission? <br />
                            This will update the status to <strong>Approved</strong> and credit <strong>+3 EVolts</strong> to the user.
                        </p>
                    ) : (
                        <div>
                            <p className="mb-4 text-black dark:text-white">
                                Please provide a reason for rejecting this submission. This will be sent to the user.
                            </p>
                            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Type your reason here..."
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                            ></textarea>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={`rounded px-6 py-2 font-medium text-white hover:bg-opacity-90 ${type === "approve" ? "bg-green-600" : "bg-red-600"
                            }`}
                    >
                        {type === "approve" ? "Confirm Approve" : "Confirm Reject"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ActionModal;

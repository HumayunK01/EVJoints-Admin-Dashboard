import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import { StationSubmission, Connector } from "@/lib/api";
import { Trash2, Plus, GripVertical, MapPin, Zap, Image as ImageIcon } from "lucide-react";

interface EditSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    submission: StationSubmission | null;
    onSave: (updatedSubmission: StationSubmission) => void;
}

const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
    isOpen,
    onClose,
    submission,
    onSave,
}) => {
    const [formData, setFormData] = useState<StationSubmission | null>(null);

    useEffect(() => {
        if (submission) {
            setFormData({ ...submission });
        }
    }, [submission]);

    if (!formData) return null;

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    };

    const handleConnectorChange = (
        index: number,
        field: keyof Connector,
        value: string | number
    ) => {
        setFormData((prev) => {
            if (!prev) return null;
            const updatedConnectors = [...prev.connectors];
            updatedConnectors[index] = {
                ...updatedConnectors[index],
                [field]: value,
            };
            return { ...prev, connectors: updatedConnectors };
        });
    };

    const addConnector = () => {
        setFormData((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                connectors: [
                    ...prev.connectors,
                    { name: "", count: 1, type: "DC" },
                ],
            };
        });
    };

    const removeConnector = (index: number) => {
        setFormData((prev) => {
            if (!prev) return null;
            const updatedConnectors = prev.connectors.filter((_, i) => i !== index);
            return { ...prev, connectors: updatedConnectors };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            if (!formData.stationName || !formData.networkName) {
                alert("Please fill in all required fields.");
                return;
            }
            onSave(formData);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Station Submission"
            className="max-w-5xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                    {/* Left Column: Core Details */}
                    <div className="rounded-lg border border-stroke bg-gray-50 p-5 dark:border-strokedark dark:bg-meta-4/30 h-full">
                        <h5 className="mb-5 text-base font-semibold text-black dark:text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Station Information
                        </h5>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Station Name
                                </label>
                                <input
                                    type="text"
                                    name="stationName"
                                    value={formData.stationName}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Network Name
                                    </label>
                                    <select
                                        name="networkName"
                                        value={formData.networkName}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="Tata Power">Tata Power</option>
                                        <option value="Zeon Charging">Zeon Charging</option>
                                        <option value="Statiq">Statiq</option>
                                        <option value="Private">Private</option>
                                        <option value="Ather Grid">Ather Grid</option>
                                        <option value="ChargeZone">ChargeZone</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Station Type
                                    </label>
                                    <select
                                        name="stationType"
                                        value={formData.stationType || ''}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Mall">Mall</option>
                                        <option value="Residential">Residential</option>
                                        <option value="Highway">Highway</option>
                                        <option value="Office Complex">Office Complex</option>
                                        <option value="Shopping Complex">Shopping Complex</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Usage Type
                                    </label>
                                    <select
                                        name="usageType"
                                        value={formData.usageType}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    >
                                        <option value="Public">Public</option>
                                        <option value="Private">Private</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Contact Number
                                    </label>
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Latitude (Read-only)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.latitude}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-md border border-stroke bg-gray-100 px-3 py-2 text-sm text-gray-500 outline-none dark:border-strokedark dark:bg-form-input dark:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Longitude (Read-only)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.longitude}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-md border border-stroke bg-gray-100 px-3 py-2 text-sm text-gray-500 outline-none dark:border-strokedark dark:bg-form-input dark:text-gray-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Connectors and Media */}
                    <div className="flex flex-col gap-6">
                        {/* Connectors Block */}
                        <div className="rounded-lg border border-stroke bg-gray-50 p-5 dark:border-strokedark dark:bg-meta-4/30">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="text-base font-semibold text-black dark:text-white flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-warning" />
                                    Connectors
                                </h5>
                                <button
                                    type="button"
                                    onClick={addConnector}
                                    className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-inset ring-stroke hover:bg-gray-50 dark:bg-form-input dark:ring-strokedark dark:hover:bg-opacity-90"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    Add
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                {formData.connectors.map((connector, index) => (
                                    <div
                                        key={index}
                                        className="group relative flex flex-col gap-3 rounded-md border border-stroke bg-white p-3 shadow-sm dark:border-strokedark dark:bg-form-input sm:flex-row sm:items-center"
                                    >
                                        <div className="hidden sm:block text-gray-400">
                                            <GripVertical size={16} />
                                        </div>

                                        <div className="flex-1">
                                            <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                                            <input
                                                type="text"
                                                value={connector.name}
                                                onChange={(e) =>
                                                    handleConnectorChange(index, "name", e.target.value)
                                                }
                                                placeholder="e.g. CCS 2"
                                                className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 sm:flex sm:w-auto">
                                            <div className="w-full sm:w-20">
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Count</label>
                                                <input
                                                    type="number"
                                                    value={connector.count}
                                                    onChange={(e) =>
                                                        handleConnectorChange(
                                                            index,
                                                            "count",
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                                />
                                            </div>
                                            <div className="w-full sm:w-24">
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                                                <select
                                                    value={connector.type}
                                                    onChange={(e) =>
                                                        handleConnectorChange(index, "type", e.target.value)
                                                    }
                                                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                                >
                                                    <option value="AC">AC</option>
                                                    <option value="DC">DC</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeConnector(index)}
                                            className="absolute top-2 right-2 sm:static sm:self-center text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Media Block */}
                        <div className="rounded-lg border border-stroke bg-gray-50 p-5 dark:border-strokedark dark:bg-meta-4/30 h-full">
                            <h5 className="mb-4 text-base font-semibold text-black dark:text-white flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                                Station Photos
                            </h5>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {formData.photos.map((photo, i) => (
                                    <div key={i} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-form-input hover:border-primary transition-colors cursor-pointer">
                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                            <ImageIcon size={32} />
                                        </div>
                                        <span className="absolute bottom-1 w-full text-center text-[10px] font-medium text-gray-500 bg-white/80 dark:bg-black/50 backdrop-blur-[2px]">Photo {i + 1}</span>
                                    </div>
                                ))}
                                {formData.photos.length === 0 && (
                                    <div className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-stroke bg-white py-8 text-gray-500 dark:border-strokedark dark:bg-form-input">
                                        <ImageIcon className="mb-2 h-8 w-8 opacity-50" />
                                        <span className="text-sm">No photos attached</span>
                                    </div>
                                )}
                                <div className="h-24 w-24 shrink-0 flex flex-col items-center justify-center rounded-lg border border-dashed border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer transition-colors">
                                    <Plus size={24} />
                                    <span className="text-[10px] font-medium mt-1">Add New</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-stroke dark:border-strokedark">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-stroke bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-1 hover:bg-opacity-90"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditSubmissionModal;

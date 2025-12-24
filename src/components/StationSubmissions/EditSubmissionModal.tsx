"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    MapPin,
    Zap,
    Save,
    Plus,
    Trash2,
    Info,
    Mail,
    Phone,
    Clock,
    Tag,
    Activity,
    CreditCard
} from 'lucide-react';
import { StationSubmission, Connector } from '@/lib/api';
import { SearchableSelect } from "@/components/ui/searchable-select";
import { NETWORK_NAMES } from "@/data/networks";

interface EditSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: StationSubmission) => void;
    submission: StationSubmission | null;
}

const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    submission
}) => {
    const [formData, setFormData] = useState<StationSubmission | null>(null);

    useEffect(() => {
        if (submission) {
            setFormData({ ...submission });
        }
    }, [submission]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } as StationSubmission : null);
    };

    const handleConnectorChange = (index: number, field: keyof Connector, value: any) => {
        setFormData(prev => {
            if (!prev) return null;
            const newConnectors = [...prev.connectors];
            newConnectors[index] = { ...newConnectors[index], [field]: value };
            return { ...prev, connectors: newConnectors };
        });
    };

    const addConnector = () => {
        const newConnector: Connector = { name: '', count: 1, type: 'AC', powerRating: '', tariff: '' };
        setFormData(prev => prev ? { ...prev, connectors: [...prev.connectors, newConnector] } : null);
    };

    const removeConnector = (index: number) => {
        const newConnectors = formData.connectors.filter((_, i) => i !== index);
        setFormData(prev => prev ? { ...prev, connectors: newConnectors } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-dark">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-gray-dark">
                    <div>
                        <h3 className="text-xl font-bold text-black dark:text-white">
                            Edit Station Details
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {formData.stationNumber} • Added by {formData.userName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 dark:hover:bg-meta-4"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column: Basic Info */}
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
                                        className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                            Network Name
                                        </label>
                                        <SearchableSelect
                                            options={NETWORK_NAMES}
                                            value={formData.networkName}
                                            onChange={(val) => setFormData(prev => prev ? { ...prev, networkName: val } : null)}
                                            placeholder="Search network..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                            Station Type
                                        </label>
                                        <input
                                            type="text"
                                            name="stationType"
                                            value={formData.stationType || ''}
                                            onChange={handleChange}
                                            placeholder="e.g., Mall, Highway"
                                            className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                            Usage Type
                                        </label>
                                        <SearchableSelect
                                            options={["Public", "Private"]}
                                            value={formData.usageType}
                                            onChange={(val) => setFormData(prev => prev ? { ...prev, usageType: val as "Public" | "Private" } : null)}
                                            placeholder="Select Usage"
                                            hideSearch={true}
                                        />
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
                                            className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
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
                                            className="w-full rounded border border-stroke bg-gray-100 px-3 py-2 text-sm text-gray-500 outline-none dark:border-strokedark dark:bg-meta-4/20"
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
                                            className="w-full rounded border border-stroke bg-gray-100 px-3 py-2 text-sm text-gray-500 outline-none dark:border-strokedark dark:bg-meta-4/20"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Operational Hours
                                    </label>
                                    <input
                                        type="text"
                                        name="operationalHours"
                                        value={formData.operationalHours}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Connectors */}
                        <div className="rounded-lg border border-stroke bg-gray-50 p-5 dark:border-strokedark dark:bg-meta-4/30">
                            <div className="mb-5 flex items-center justify-between">
                                <h5 className="text-base font-semibold text-black dark:text-white flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-secondary" />
                                    Connectors Configuration
                                </h5>
                                <button
                                    type="button"
                                    onClick={addConnector}
                                    className="flex items-center gap-1 rounded bg-secondary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-opacity-90"
                                >
                                    <Plus className="h-4 w-4" /> Add New
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.connectors.map((connector, index) => (
                                    <div
                                        key={index}
                                        className="relative rounded-lg border border-stroke bg-white p-4 shadow-sm transition hover:border-primary dark:border-strokedark dark:bg-boxdark"
                                    >
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="col-span-full sm:col-span-1">
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
                                                <input
                                                    type="text"
                                                    value={connector.name}
                                                    onChange={(e) => handleConnectorChange(index, "name", e.target.value)}
                                                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32">
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                                                <SearchableSelect
                                                    options={["AC", "DC"]}
                                                    value={connector.type}
                                                    onChange={(val) => handleConnectorChange(index, "type", val)}
                                                    placeholder="AC/DC"
                                                    hideSearch={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Count</label>
                                                <input
                                                    type="number"
                                                    value={connector.count}
                                                    onChange={(e) => handleConnectorChange(index, "count", parseInt(e.target.value))}
                                                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Power</label>
                                                <input
                                                    type="text"
                                                    value={connector.powerRating}
                                                    onChange={(e) => handleConnectorChange(index, "powerRating", e.target.value)}
                                                    placeholder="e.g. 7.4kW"
                                                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-500">Tariff</label>
                                                <input
                                                    type="text"
                                                    value={connector.tariff}
                                                    onChange={(e) => handleConnectorChange(index, "tariff", e.target.value)}
                                                    placeholder="Rate"
                                                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeConnector(index)}
                                            className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm transition hover:bg-red-500 hover:text-white dark:bg-meta-4 dark:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-4 border-t border-stroke pt-6 dark:border-strokedark">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-stroke px-8 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-lg bg-primary px-10 py-3 text-sm font-medium text-white transition hover:bg-opacity-90"
                        >
                            <Save className="h-4 w-4" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSubmissionModal;

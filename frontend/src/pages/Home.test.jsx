import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./Home";


const api = vi.hoisted(() => ({
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
}));

vi.mock("../api", () => ({ default: api }));
vi.mock("../components/LogoutButton", () => ({
    default: () => <button type="button">Logout</button>,
}));


const note = (isPinned = false) => ({
    author: 1,
    content: "A note body",
    created_at: "2026-10-26T10:00:00Z",
    id: 1,
    is_pinned: isPinned,
    title: "Interview prep",
});

const renderHome = () => render(
    <MemoryRouter>
        <Home />
    </MemoryRouter>
);

describe("Home note pinning", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get.mockResolvedValue({ data: [note()] });
    });

    it("renders an unpinned note with a pin control", async () => {
        renderHome();

        const pinButton = await screen.findByRole("button", { name: "Pin note" });

        expect(pinButton).toHaveAttribute("aria-pressed", "false");
        expect(screen.queryByText("Pinned")).not.toBeInTheDocument();
    });

    it("renders a pinned note with an unpin control and badge", async () => {
        api.get.mockResolvedValue({ data: [note(true)] });
        renderHome();

        const unpinButton = await screen.findByRole("button", { name: "Unpin note" });

        expect(unpinButton).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText("Pinned")).toBeInTheDocument();
    });

    it("updates the note only after a successful pin response", async () => {
        api.patch.mockResolvedValue({ data: note(true), status: 200 });
        renderHome();

        fireEvent.click(await screen.findByRole("button", { name: "Pin note" }));

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith("/api/notes/1/", { is_pinned: true });
        });
        expect(await screen.findByRole("button", { name: "Unpin note" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Note pinned.");
    });

    it("can unpin a pinned note after a successful response", async () => {
        api.get.mockResolvedValue({ data: [note(true)] });
        api.patch.mockResolvedValue({ data: note(false), status: 200 });
        renderHome();

        fireEvent.click(await screen.findByRole("button", { name: "Unpin note" }));

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith("/api/notes/1/", { is_pinned: false });
        });
        expect(await screen.findByRole("button", { name: "Pin note" })).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Note unpinned.");
    });

    it("disables the pin action while a request is pending", async () => {
        let resolvePatch;
        api.patch.mockReturnValue(new Promise((resolve) => {
            resolvePatch = resolve;
        }));
        renderHome();

        const pinButton = await screen.findByRole("button", { name: "Pin note" });
        fireEvent.click(pinButton);

        expect(screen.getByRole("button", { name: "Updating pin status" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Updating pin status" }));
        expect(api.patch).toHaveBeenCalledTimes(1);

        resolvePatch({ data: note(true), status: 200 });
        expect(await screen.findByRole("button", { name: "Unpin note" })).toBeInTheDocument();
    });

    it("shows an error and permits retry after a failed pin request", async () => {
        api.patch
            .mockRejectedValueOnce(new Error("Network error"))
            .mockResolvedValueOnce({ data: note(true), status: 200 });
        renderHome();

        fireEvent.click(await screen.findByRole("button", { name: "Pin note" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "We could not update the pinned state. Please try again."
        );
        fireEvent.click(screen.getByRole("button", { name: "Pin note" }));

        expect(await screen.findByRole("button", { name: "Unpin note" })).toBeInTheDocument();
        expect(api.patch).toHaveBeenCalledTimes(2);
    });
});

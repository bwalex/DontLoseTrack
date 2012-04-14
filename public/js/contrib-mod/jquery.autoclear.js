define(['jquery'], function(jQuery) {
/**
 * Apply a helper value to text fields quickly &amp; easily.
 *
 * The easiest way to use is $('your-selector').autoclear(). All the defaults
 * in the settings object are used. For more advanced cases, and complete
 * reference, @see http://www.mattlunn.me.uk/projects/autoclear
 *
 * @author Matt Lunn
 * @version 7
 * @param  Object / String
 * @return Object jQuery
 * @see http://www.mattlunn.me.uk/projects/autoclear
 * @see README
 */
(function ($) {
    var slice = [].slice;
    // Reference to the val function we will be extending
    var _val = jQuery.fn.val;

    /**
     * The actual autoclear functionality
     *
     * @param  Object / String
     * @return Object jQuery
     * @see http://www.mattlunn.me.uk/projects/autoclear
     * @see README
     */
    jQuery.fn.autoclear = function (options) {
        var settings = {
            defaultClass: 'default',
            otherClass: 'other',
            defaultValue: '',
            useDefaultOnReset: true,
            clearDefaultOnSubmit: true
        };

        if (arguments.length) {
            switch (typeof options) {
            case "string":
                settings.defaultClass = options;
            break;
            case "object":
                settings = jQuery.extend(settings, options);
            break;
            };
        };

        return this.bind({
            'default.autoclear': function () {
                var self = $(this).removeClass(settings.otherClass).
                                   addClass(settings.defaultClass);

                val(self, self.data('default.autoclear'));
            },
            'other.autoclear': function () {
                var self = $(this);

                self.removeClass(settings.defaultClass).
                     addClass(settings.otherClass);
            },
            'focus.autoclear blur.autoclear': function (e) {
                var handler = ((e.type === "focus") ? clearHelperIfShown
                                                    : renderCorrectState);

                handler(this);
            }
        }).each(function () {
            // self caches $(this) for optimization
            var self = $(this);
            // The parent form of the input field.
            var form = self.closest('form');
            // The current value held by the input field
            var currentValue = jQuery.trim(val(self));
            // Holds the value chosen to show as the helper text
            var defaultValue = self.attr('title');

            // Calculate the actual defaultValue. If `title` is empty, we take
            // the current value of the input field unless it's empty, in which
            // case we fall back to the defaultValue in the settings object.
            if (isBlank(defaultValue)) {
                if (currentValue === '') {
                    defaultValue = settings.defaultValue;
                } else {
                    defaultValue = currentValue;
                };
            };

            // Set the default value
            self.data('default.autoclear', defaultValue);			

            // When resetting a form, is using useDefaultOnReset, we need to
            // apply styles for default text; otherwise apply styles to what
            // was shown on page load. We do this after a short timeout, to ensure
            // the event was not actually cancelled by another hander.
            form.bind('reset.autoclear', function (event) {
                var e = event.originalEvent;
                
                setTimeout(function () {
                  // Don't use event.isDefaultPrevented; the event object
                  // we get passed will NOT be up-to-date if a delegate or live
                  // bound handler cancels the event. jQuery.Event(e.origEvent)
                  // is broken prior to 1.5, so don't use that either!
                  // http://bugs.jquery.com/ticket/7793
                  if (!(e.defaultPrevented || e.returnValue === false 
                      || e.getPreventDefault && e.getPreventDefault())) {
                      
                    var expectedValue;

                    if (settings.useDefaultOnReset) {
                        expectedValue = '';
                    } else {
                        expectedValue = self.attr('defaultValue');
                    };

                    self.val(expectedValue);
                  };
                }, 0);
            });

            // If we have useDefaultOnReset, or there is no defaultValue,
            // set the defaultValue to the helper text. This is so that if a
            // form reset occurs, the intended value is set.
            if (settings.useDefaultOnReset
                || isBlank(jQuery.trim(self.attr('defaultValue')))) {

                self.attr('defaultValue', defaultValue).val(currentValue);
            };

            // If we dont want to submit default values, we need to clear any
            // helper values when the form is submitted. We set an immediate
            // timeout to show the correct state again, incase the form
            // submission is cancelled, and to make the page look nice whilst
            // the POST is happening.
            if (settings.clearDefaultOnSubmit) {
                form.bind('submit.autoclear', function (event) {
                    if (!event.isDefaultPrevented()) {
                        clearHelperIfShown(self);

                        setTimeout(function () {
                          renderCorrectState(self);
                        }, 0);
                    };
                });
            };

            // Intial setup of element.
            renderCorrectState(this);
        });
    };

    /**
     * Extend the jQuery.fn.val function to apply the helper text automatically
     * if the value is set to empty, and to automatically return an empty
     * string if val() is called on an element showing the helper text.
     *
     * @see link		http://api.jquery.com/val
     * @param Mixed		Any mixture of valid arguments for native val
     * @return Mixed	Result of native val
     */
    jQuery.fn.val = function () {
        var result = _val.apply(this, arguments);
        var defaultValue;

        // Getter
        if (typeof result === "string") {
            defaultValue = this.first().data    ('default.autoclear');

            if (defaultValue !== undefined && result === defaultValue) {
                result = '';
            };
        } else {
        // Setter

            this.each(function () {
                var self = $(this);
                var defaultValue = self.data('default.autoclear');

                if (defaultValue !== undefined && self.val() === '') {
                    self.trigger('default.autoclear');
                } else {
                    self.trigger('other.autoclear');
                };
            });
        };

        return result;
    };

    /**
     * Helper function which detects whether the provided value is either
     * undefined or an empty string.
     *
     * @param 	prop	String	Property to check
     * @return	Boolean	Is it blank?
     */
    function isBlank (prop) {
        return prop === undefined || prop === '';
    };

    /**
     * Helper function that applies native jQuery val to provided object.
     *
     * @param el	Object	jQuery object to apply val to
     * @param arg	Mixed	Optional: Parameter that will be passed to val
     * @return Mixed		Result of applying val to the jQuery Object
     */
    function val (el) {
        return _val.apply(el, slice.call(arguments, 1));
    };

    /**
     * Helper function which will trigger the handlers bound to the
     * "other.autoclear" event if the helper text is being displayed, or no
     * value is being displayed. By default, autoclear binds a handler to
     * "other.autoclear" which will remove the default class, show the other
     * class, and set the element value to "".
     *
     * @param self  Object  Value accepted by jQuery constructor to select
     *                      element to potentially clear.
     * @return Object       jQuery object of "self".
     */
    function clearHelperIfShown (self) {
        self = $(self);

        if (self.val() === '') {
            val(self, '').trigger('other.autoclear');
        };

        return self;
    };

    /**
     * Helper function which will trigger the handlers bound to either the
     * "default.autoclear" or "other.autoclear" events depending on whether the
     * element provided contains a value or not.
     *
     * @param self  Object  Value accepted by jQuery constructor to select
     *                      element to potentially clear.
     * @return Object       jQuery object of "self".
     */
    function renderCorrectState (self) {
        self = $(self);

        var value = jQuery.trim(self.val());

        if (value === '') {
            self.trigger('default.autoclear');
        } else {
            self.trigger('other.autoclear');
        };

        return self;
    };

}(jQuery));
});